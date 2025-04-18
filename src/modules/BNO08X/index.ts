import { sleep } from '../../utils';
import { Module } from '../Module';
import { Packet, PacketError, PacketHeader } from './Packet';
export * from './constants';
import { BNO_CHANNEL_EXE, FEATURE_ENABLE_TIMEOUT, ENABLED_ACTIVITIES, DEFAULT_REPORT_INTERVAL, SHTP_REPORT_PRODUCT_ID_REQUEST, SET_FEATURE_COMMAND, BNO_CHANNEL_CONTROL, SHTP_REPORT_PRODUCT_ID_RESPONSE, BNO_CHANNEL_SHTP_COMMAND, AVAIL_SENSOR_REPORTS, REPORT_LENGTHS, ME_CALIBRATE, SAVE_DCD, GET_FEATURE_RESPONSE, INITIAL_REPORTS, COMMAND_RESPONSE, BNO_REPORT_STEP_COUNTER, BNO_REPORT_SHAKE_DETECTOR, BNO_REPORT_STABILITY_CLASSIFIER, BNO_REPORT_ACTIVITY_CLASSIFIER, BNO_REPORT_MAGNETOMETER, RAW_REPORTS, BNO_HEADER_LEN, BNO_REPORT_ACCELEROMETER, BNO_REPORT_GYROSCOPE, BNO_REPORT_ROTATION_VECTOR, ME_CAL_CONFIG, COMMAND_REQUEST, DEFAULT_TIMEOUT, ME_GET_CAL } from './constants';


type Config = {
    address: number;
    dataBufferSize: number;
    packetReadTimeout: number;
};

export class BNO08X extends Module<Config> {
    config = {
        address: 0x4B,
        dataBufferSize: 512,
        packetReadTimeout: 2.0,
    };

    private dataBuffer: Buffer;
    private commandBuffer: Buffer = Buffer.alloc(12)
    private readings: Record<number, any> = {}; // for saving the most recent reading when decoding several packets
    private meCalibrationStartedAt: number = -1;
    private calibrationComplete: boolean = false;
    private magnetometerAccuracy: number = 0;
    private waitForInitialize: boolean = true;
    private initComplete: boolean = false;
    private idRead: boolean = false;
    private packetSlices: [number, Buffer][] = [];

    // TODO: this is wrong there should be one per channel per direction
    private sequenceNumber: number[] = [0, 0, 0, 0, 0, 0];
    private twoEndedSequenceNumbers: Map<number, number> = new Map();
    private dcdSavedAt: number = -1;

    constructor(busNumber?: number, config?: Partial<Config>) {
        super(busNumber);
        this.config = Object.assign(this.config, config);
        this.dataBuffer = Buffer.alloc(this.config.dataBufferSize);
    }

    /**
     * Initialize the sensor
     */
    async init() {
        super.init();

        for (let i = 0; i < 3; i++) {
            // this.hardReset();
            await this.softReset();
            try {
                if (await this.checkId()) {
                    return;
                }
            } catch (error) {
                await sleep(500);
            }
        }

        throw new Error("Could not read ID");
    }

    getFeatureEnableReport(
        featureId: keyof typeof AVAIL_SENSOR_REPORTS,
        sensorSpecificConfig: number = 0,
        reportInterval: number = DEFAULT_REPORT_INTERVAL,
    ): Buffer {
        let setFeatureReport = Buffer.alloc(17);
        setFeatureReport[0] = SET_FEATURE_COMMAND;
        setFeatureReport[1] = featureId;
        setFeatureReport.writeUInt32LE(reportInterval, 5);
        setFeatureReport.writeUInt32LE(sensorSpecificConfig, 13);

        return setFeatureReport;
    }

    async beginCalibration() {
        await this.sendMeCommand(
            [
                1,  // calibrate accel
                1,  // calibrate gyro
                1,  // calibrate mag
                ME_CAL_CONFIG,
                0,  // calibrate planar acceleration
                0,  // 'on_table' calibration
                0,  // reserved
                0,  // reserved
                0,  // reserved
            ]
        )

        this.calibrationComplete = false;
    }
    async calibrationStatus() {
        await this.sendMeCommand([
            0, // calibrate accel
            0, // calibrate gyro
            0, // calibrate mag
            ME_GET_CAL, // constant value for getting calibration status
            0, // calibrate planar acceleration
            0, // 'on_table' calibration
            0, // reserved
            0, // reserved
            0, // reserved
        ]);

        return this.magnetometerAccuracy;
    }

    private async sendMeCommand(subcommandParams?: number[]): Promise<void> {
        const startTime = Date.now();
        const localBuffer = this.commandBuffer;

        this.insertCommandRequestReport(
            ME_CALIBRATE,
            this.commandBuffer, // should use this._dataBuffer :\ but sendPacket doesn't
            this.getReportSeqId(COMMAND_REQUEST),
            subcommandParams,
        );

        await this.sendPacket(BNO_CHANNEL_CONTROL, localBuffer);
        this.incrementReportSeq(COMMAND_REQUEST);
        while (Date.now() - startTime < DEFAULT_TIMEOUT) {
            await this.processAvailablePackets();
            if (this.meCalibrationStartedAt > startTime) {
                break;
            }
        }
    }

    private incrementReportSeq(reportId: number): void {
        const current = this.twoEndedSequenceNumbers.get(reportId) ?? 0;
        this.twoEndedSequenceNumbers.set(reportId, (current + 1) % 256);
    }

    private getReportSeqId(reportId: number): number {
        return this.twoEndedSequenceNumbers.get(reportId) ?? 0;
    }

    private insertCommandRequestReport(
        command: number,
        buffer: Buffer,
        nextSequenceNumber: number,
        commandParams?: number[]
    ): void {
        if (commandParams && commandParams.length > 9) {
            throw new Error(`Command request reports can only have up to 9 arguments but ${commandParams.length} were given`);
        }
        buffer.fill(0, 0, 12);
        buffer[0] = COMMAND_REQUEST;
        buffer[1] = nextSequenceNumber;
        buffer[2] = command;
        if (commandParams === undefined) {
            return;
        }

        commandParams.forEach((param, idx) => {
            buffer[3 + idx] = param;
        });
    }

    /**
     * Used to enable a given feature of the BNO08x
     */
    async enableFeature(featureId: keyof typeof AVAIL_SENSOR_REPORTS) {
        this.debug("\n********** Enabling feature id:", featureId, "**********")

        let setFeatureReport: Buffer;
        if (featureId === BNO_REPORT_ACTIVITY_CLASSIFIER) {
            setFeatureReport = this.getFeatureEnableReport(featureId, ENABLED_ACTIVITIES);
        } else {
            setFeatureReport = this.getFeatureEnableReport(featureId);
        }

        let featureDependency = RAW_REPORTS[featureId]; //rawReports.get(featureId, null);

        if (featureDependency && !(featureDependency in this.readings)) {
            this.debug("Enabling feature dependency:", featureDependency);
            await this.enableFeature(featureDependency);
        }
        // if the feature was enabled it will have a key in the readings dict

        this.debug("Enabling", featureId);
        await this.sendPacket(BNO_CHANNEL_CONTROL, setFeatureReport);

        let startTime = Date.now();  // 1

        while ((Date.now() - startTime) < FEATURE_ENABLE_TIMEOUT) {
            await this.processAvailablePackets(10);
            if (featureId in this.readings) {
                return;
            }
        }
        throw new Error("Was not able to enable feature " + featureId);

    }

    /**
     * A tuple representing the acceleration measurements on the X, Y, and Z
     * axes in meters per second squared 
    */
    async acceleration(): Promise<[number, number, number]> {
        await this.processAvailablePackets();
        if (this.readings[BNO_REPORT_ACCELEROMETER]) {
            return this.readings[BNO_REPORT_ACCELEROMETER];
        } else {
            throw new Error("No accel report found, is it enabled?");
        }
    }

    /**
     * Get the roll pitch yaw on xyz axis using acceleration
     */
    async euler(): Promise<[number, number, number]> {
        // Placeholder values for acceleration on x, y, and z axes
        // Replace these with actual accelerometer readings
        const [ax, ay, az] = await this.acceleration()

        // Calculate roll and pitch based on the acceleration data
        // Roll (rotation around x-axis)
        const roll = Math.atan2(ay, az);
        // Pitch (rotation around y-axis)
        const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));

        // Yaw (rotation around z-axis) cannot be determined from acceleration alone
        // Placeholder value for yaw
        const yaw = 0; // This would require a magnetometer to calculate accurately

        // Convert radians to degrees
        const rollDeg = roll * (180 / Math.PI);
        const pitchDeg = pitch * (180 / Math.PI);
        const yawDeg = yaw * (180 / Math.PI);

        return [rollDeg, pitchDeg, yawDeg];
    }

    /**
     * A tuple representing Gyro's rotation measurements on the X, Y, and Z
     * axes in radians per second
     */
    async gyro(): Promise<[number, number, number]> {
        await this.processAvailablePackets();
        if (this.readings[BNO_REPORT_GYROSCOPE]) {
            return this.readings[BNO_REPORT_GYROSCOPE];
        } else {
            throw new Error("No gyro report found, is it enabled?");
        }
    }

    /**
     * A tuple of the current magnetic field measurements on the X, Y, and Z axes
     */
    async magnetic(): Promise<[number, number, number]> {
        await this.processAvailablePackets();
        if (this.readings[BNO_REPORT_MAGNETOMETER]) {
            return this.readings[BNO_REPORT_MAGNETOMETER];
        } else {
            throw new Error("No magfield report found, is it enabled?");
        }
    }

    /**
     * The current heading in degrees
     */
    async heading() {
        const [magX, magY] = await this.magnetic(); // Assuming bno.magnetic() returns [magX, magY, magZ]
        let heading = Math.atan2(magY, magX) * (180 / Math.PI); // Convert radians to degrees
        if (heading < 0) {
            heading += 360; // Adjust for negative values to get a full 360° range
        }

        return heading;
    }

    /**
     * A quaternion representing the current rotation vector
     */
    async quaternion(): Promise<[number, number, number, number]> {
        await this.processAvailablePackets();
        if (this.readings[BNO_REPORT_ROTATION_VECTOR]) {
            return this.readings[BNO_REPORT_ROTATION_VECTOR];
        } else {
            throw new Error("No quaternion report found, is it enabled?");
        }
    }

    /**
     * A quaternion representing the current rotation vector expressed as a quaternion with no
     * specific reference for heading, while roll and pitch are referenced against gravity. To
     * prevent sudden jumps in heading due to corrections, the `gameQuaternion` property is not
     * corrected using the magnetometer. Some drift is expected
     */
    async gameQuaternion(): Promise<[number, number, number, number]> {
        await this.processAvailablePackets();
        if (this.readings[BNO_REPORT_ROTATION_VECTOR]) {
            return this.readings[BNO_REPORT_ROTATION_VECTOR];
        } else {
            throw new Error("No quaternion report found, is it enabled?");
        }
    }

    /**
     * The number of steps detected since the sensor was initialized
     */
    async steps(): Promise<number> {
        await this.processAvailablePackets();
        if (this.readings[BNO_REPORT_STEP_COUNTER]) {
            return this.readings[BNO_REPORT_STEP_COUNTER];
        } else {
            throw new Error("No quaternion report found, is it enabled?");
        }
    }

    async processAvailablePackets(maxPackets: number | null = null) {
        let processedCount = 0;
        while (await this.dataReady()) {
            if (maxPackets && processedCount > maxPackets) {
                return;
            }

            let packet: Packet;
            try {
                packet = await this.readPacket();
            } catch (error) {
                if (error instanceof PacketError) {
                    continue;
                } else {
                    throw error;
                }
            }

            this.handlePacket(packet);
            processedCount += 1;
        }
        this.debug(" ** DONE! **");
    }

    private async hardReset() { }
    /**
     * Reset the sensor to an initial unconfigured state
     */
    private async softReset() {
        this.debug("Soft resetting...", "");
        const data = Buffer.from([1]);

        await this.sendPacket(BNO_CHANNEL_EXE, data);
        await sleep(500);

        for (let i = 0; i < 3; i++) {
            try {
                const _packet = await this.readPacket();
            } catch (error) {
                if (error instanceof PacketError) {
                    await sleep(500);
                } else {
                    throw error;
                }
            }
        }

        this.debug("OK!");
    }
    private async checkId(): Promise<boolean> {
        this.debug("\n********** READ ID **********");
        if (this.idRead) {
            return true;
        }

        let data = Buffer.from([
            SHTP_REPORT_PRODUCT_ID_REQUEST,
            0, // padding
        ]);

        this.debug("\n** Sending ID Request Report **");
        await this.sendPacket(BNO_CHANNEL_CONTROL, data);

        this.debug("\n** Waiting for packet **");
        // _a_ packet arrived, but which one?
        // TODO this could cause an infinite loop? False never reached?
        while (true) {
            const packet = await this.waitForPacketType(BNO_CHANNEL_CONTROL, SHTP_REPORT_PRODUCT_ID_RESPONSE);
            let sensorId = this.parseSensorId(packet);
            if (sensorId) {
                this.idRead = true;
                return true;
            }
            this.debug("Packet didn't have sensor ID report, trying again");
        }

        return false;
    }

    private parseSensorId(packet: Packet): number | null {
        if (packet.data[0] !== SHTP_REPORT_PRODUCT_ID_RESPONSE) {
            return null;
        }

        const swMajor = packet.data.readUInt8(2);
        const swMinor = packet.data.readUInt8(3);
        const swPatch = packet.data.readUInt16LE(12);
        const swPartNumber = packet.data.readUInt32LE(4);
        const swBuildNumber = packet.data.readUInt32LE(8);

        this.debug("FROM PACKET SLICE:");
        this.debug(`*** Part Number: ${swPartNumber}`);
        this.debug(`*** Software Version: ${swMajor}.${swMinor}.${swPatch}`);
        this.debug(`*** Build: ${swBuildNumber}`);

        return swPartNumber;
    }

    private async waitForPacketType(channelNumber: number, reportId: number | null = null, timeout: number = 5000.0): Promise<Packet> {
        this.debug(`** Waiting for packet on channel ${channelNumber}${reportId ? ` with report id ${reportId.toString(16)}` : ""}`);

        let start_time = Date.now();

        // TODO make these async somehow.
        while ((Date.now() - start_time) / 1000 < timeout) {
            let newPacket = await this.waitForPacket();

            if (newPacket.channelNumber === channelNumber) {
                if (reportId !== null) {
                    if (newPacket.reportId === reportId) {
                        return newPacket;
                    }
                } else {
                    return newPacket;
                }
            }
            if (![BNO_CHANNEL_EXE, BNO_CHANNEL_SHTP_COMMAND].includes(newPacket.channelNumber)) {
                this.debug("passing packet to handler for de-slicing");
                this.handlePacket(newPacket);
            }
        }

        throw new Error(`Timed out waiting for a packet on channel ${channelNumber}`);
    }

    private reportLength(report_id: number): number {
        if (report_id < 0xF0) {  // it's a sensor report
            return AVAIL_SENSOR_REPORTS[report_id][2];
        }

        return REPORT_LENGTHS[report_id];
    }

    private separateBatch(packet: Packet) {
        const reportSlices: [number, Buffer][] = [];
        // get first report id, loop up its report length
        // read that many bytes, parse them
        let nextByteIndex = 0;
        while (nextByteIndex < packet.header.dataLength) {
            const reportId = packet.data[nextByteIndex];
            const requiredBytes = this.reportLength(reportId);

            const unprocessedByteCount = packet.header.dataLength - nextByteIndex;

            // handle incomplete remainder
            if (unprocessedByteCount < requiredBytes) {
                throw new Error("Unprocessable Batch bytes " + unprocessedByteCount);
            }
            // we have enough bytes to read
            // add a slice to the list that was passed in
            const reportSlice = packet.data.subarray(nextByteIndex, nextByteIndex + requiredBytes);

            reportSlices.push([reportSlice[0], reportSlice]);
            nextByteIndex = nextByteIndex + requiredBytes;
        }

        return reportSlices;
    }

    private handlePacket(packet: Packet): void {
        try {
            const packetSlices = this.separateBatch(packet);
            while (packetSlices.length > 0) {
                this.processReport(...packetSlices.pop()!);
            }
        } catch (error) {
            console.error(packet);
            // throw error;
        }
    }

    private handleCommandResponse(reportBytes: Buffer): void {
        // in origional code: _parse_command_response
        // CMD response report:
        // 0 Report ID = 0xF1
        // 1 Sequence number
        // 2 Command
        // 3 Command sequence number
        // 4 Response sequence number
        // 5 R0-10 A set of response values. The interpretation of these values is specific
        // to the response for each command.
        const reportBody = Array.from(reportBytes.subarray(0, 5));
        const responseValues = Array.from(reportBytes.subarray(5, 16));

        const [_report_id, _seq_number, command, _command_seq_number, _response_seq_number] = reportBody;

        const [commandStatus, ..._rest] = responseValues;

        if (command === ME_CALIBRATE && commandStatus === 0) {
            this.meCalibrationStartedAt = Date.now();
        }

        if (command === SAVE_DCD) {
            if (commandStatus === 0) {
                this.dcdSavedAt = Date.now();
            } else {
                throw new Error("Unable to save calibration data");
            }
        }
    }

    private handleControlReport(reportId: number, reportBytes: Buffer): void {
        // if (reportId === SHTP_REPORT_PRODUCT_ID_RESPONSE) {
        //     // in origional code: _parse_sensor_id in main file not in class
        //     const sensorId = this.parseSensorId(reportBytes);
        //     if (!sensorId) {
        //         throw new Error(`Wrong report id for sensor id: ${reportBytes[0].toString(16)}`);
        //     }
        // }

        if (reportId === GET_FEATURE_RESPONSE) {
            // in origional code: _parse_get_feature_response_report
            // unpack_from("<BBBHIII", report_bytes)
            const getFeatureReport = [
                reportBytes.readUint8(0), // report_id
                reportBytes.readUint8(1),
                reportBytes.readUint8(2),
                reportBytes.readUInt16LE(3),
                reportBytes.readUInt32LE(5),
                reportBytes.readUInt32LE(9),
                reportBytes.readUInt32LE(13)
            ];

            const [_report_id, featureReportId, ..._remainder] = getFeatureReport;
            this.readings[featureReportId] = INITIAL_REPORTS[featureReportId] || [0.0, 0.0, 0.0];
        }

        if (reportId === COMMAND_RESPONSE) {
            this.handleCommandResponse(reportBytes);
        }
    }

    private processReport(reportId: number, reportBytes: Buffer): void {
        if (reportId >= 0xF0) {
            this.handleControlReport(reportId, reportBytes);
            return;
        }

        // this.debug("\tProcessing report:", reports[report_id]);
        // if (this._debug) {
        //     let outstr = "";
        //     for (let idx = 0; idx < report_bytes.length; idx++) {
        //         const packet_byte = report_bytes[idx];
        //         const packet_index = idx;
        //         if ((packet_index % 4) === 0) {
        //             outstr += `\nDBG::\t\t[0x${packet_index.toString(16).padStart(2, '0')}] `;
        //         }
        //         outstr += `0x${packet_byte.toString(16).padStart(2, '0')} `;
        //     }
        //     this._dbg(outstr);
        //     this._dbg("");
        // }

        if (reportId === BNO_REPORT_STEP_COUNTER) {
            this.readings[reportId] = this.parseStepCounterReport(reportBytes);
            return;
        }

        if (reportId === BNO_REPORT_SHAKE_DETECTOR) {
            const shakeDetected = this.parseShakeReport(reportBytes);
            if (!this.readings[BNO_REPORT_SHAKE_DETECTOR]) {
                this.readings[BNO_REPORT_SHAKE_DETECTOR] = shakeDetected;
            }
            return;
        }

        if (reportId === BNO_REPORT_STABILITY_CLASSIFIER) {
            const stabilityClassification = this.parseStabilityClassifierReport(reportBytes);
            this.readings[BNO_REPORT_STABILITY_CLASSIFIER] = stabilityClassification;
            return;
        }

        if (reportId === BNO_REPORT_ACTIVITY_CLASSIFIER) {
            const activityClassification = this.parseActivityClassifierReport(reportBytes);
            this.readings[BNO_REPORT_ACTIVITY_CLASSIFIER] = activityClassification;
            return;
        }

        const [sensorData, accuracy] = this.parseSensorReportData(reportBytes);
        if (reportId === BNO_REPORT_MAGNETOMETER) {
            this.magnetometerAccuracy = accuracy;
        }
        this.readings[reportId] = sensorData;
    }

    private parseSensorReportData(reportBytes: Buffer): [number[], number] {
        let dataOffset = 4;  // this may not always be true
        const reportId = reportBytes[0];
        const [scalar, count] = AVAIL_SENSOR_REPORTS[reportId];

        let isUnsigned = false;
        if (RAW_REPORTS[reportId]) {
            // raw reports are unsigned
            isUnsigned = true;
        }
        const results: number[] = [];
        let accuracy = reportBytes.readUInt8(2) & 0b11;

        for (let offsetIdx = 0; offsetIdx < count; offsetIdx++) {
            const totalOffset = dataOffset + (offsetIdx * 2);
            let rawData;
            if (isUnsigned) {
                rawData = reportBytes.readUint16LE(totalOffset);
            } else {
                rawData = reportBytes.readInt16LE(totalOffset);
            }
            const scaledData = rawData * scalar;
            results.push(scaledData);
        }

        return [results, accuracy];
    }

    private parseStepCounterReport(reportBytes: Buffer) {
        const stepCount = reportBytes.readUInt16LE(8);
        return stepCount;
    }

    private parseShakeReport(reportBytes: Buffer) {
        const shakeDetected = (reportBytes.readUInt16LE(4) & 0x111) > 0;
        return shakeDetected;
    }

    private parseStabilityClassifierReport(reportBytes: Buffer) {
        const classificationBitfield = reportBytes.readUInt8(4);
        const stabilityClassification = ["Unknown", "On Table", "Stationary", "Stable", "In motion"][classificationBitfield];
        return stabilityClassification;
    }

    private parseActivityClassifierReport(reportBytes: Buffer) {
        // 0 Report ID = 0x1E
        // 1 Sequence number
        // 2 Status
        // 3 Delay
        // 4 Page Number + EOS
        // 5 Most likely state
        // 6-15 Classification (10 x Page Number) + confidence
        const activities = [
            "Unknown",
            "In-Vehicle",
            "On-Bicycle",
            "On-Foot",
            "Still",
            "Tilting",
            "Walking",
            "Running",
            "OnStairs",
        ];

        const endAndPageNumber = reportBytes.readUInt8(4);
        const pageNumber = endAndPageNumber & 0x7F;
        const mostLikely = reportBytes.readUInt8(5);
        const confidences = Array.from(reportBytes.subarray(6, 15));

        const classification: { [key: string]: string | number } = {};
        classification["most_likely"] = activities[mostLikely];

        for (let idx = 0; idx < confidences.length; idx++) {
            const raw_confidence = confidences[idx];
            const confidence = (10 * pageNumber) + raw_confidence;
            const activity_string = activities[idx];
            classification[activity_string] = confidence;
        }

        return classification;
    }

    private async waitForPacket(timeout?: number): Promise<Packet> {
        timeout = timeout || this.config.packetReadTimeout;
        let start_time = Date.now();
        // TODO make these async somehow.
        while ((Date.now() - start_time) / 1000 < timeout) {
            if (!await this.dataReady()) {
                continue;
            }
            let packet: Packet;
            try {
                packet = await this.readPacket();
            } catch (error) {
                if (error instanceof PacketError) {
                    continue;
                } else {
                    throw error;
                }
            }

            return packet;
        }

        throw new Error("Timed out waiting for a packet");
    }

    private async readHeader(): Promise<PacketHeader> {
        const buffer = Buffer.alloc(BNO_HEADER_LEN);
        await this.readInto(buffer, buffer.length);
        // this.readInto(this.dataBuffer, 4); // this is expecting a header
        const packetHeader = Packet.headerFromBuffer(buffer);
        this.debug(packetHeader);
        return packetHeader;
    }

    private async readPacket(): Promise<Packet> {
        try {
            // TODO Might be able to remove this and get header in a better way
            // await this.readInto(this.dataBuffer, 4);  // this is expecting a header
            // const header = Packet.headerFromBuffer(this.dataBuffer);

            // let packetByteCount = header.packetByteCount;
            // const channelNumber = header.channelNumber;
            // const sequenceNumber = header.sequenceNumber;

            // this.sequenceNumber[channelNumber] = sequenceNumber;
            // if (packetByteCount === 0) {
            //     this.debug("SKIPPING NO PACKETS AVAILABLE IN i2c._read_packet");
            //     throw new PacketError("No packet available");
            // }

            // packetByteCount -= 4;
            // this.debug(
            //     "channel",
            //     channelNumber,
            //     "has",
            //     packetByteCount,
            //     "bytes available to read",
            // );
            // const header = await this.readHeader();

            // HERE Have commented out is ready to see if it's receiving the data from the sensor and messing up all the other reads.
            // I think we need to read the data as it comes in and then parse it into packets.
            // const headerData = Buffer.alloc(4);
            // await this.readInto(headerData, headerData.length);

            // let packetByteCount = header.packetByteCount - 4;
            const header = await this.readHeader();
            // this.updateSequenceNumber(header);

            const buffer = Buffer.alloc(header.packetByteCount);
            await this.readInto(buffer, buffer.length);

            const packet = new Packet(buffer);
            // await this.read(packetByteCount);

            // const newPacket = new Packet(this.dataBuffer);
            this.debug(packet);

            // this.updateSequenceNumber(packet.header);

            return packet;
        } catch (error) {
            throw new PacketError("Failed to load packet");
        }
    }

    // This might no be nessesary since directions have different sequence numbers. Do we need to read with the same sequence number?
    private updateSequenceNumber(packetHeader: PacketHeader): void {
        const channel = packetHeader.channelNumber;
        const seq = packetHeader.sequenceNumber;
        this.sequenceNumber[channel] = seq;
    }

    private async read(requestedReadLength: number) {
        this.debug("trying to read", requestedReadLength, "bytes");
        // +4 for the header
        const totalReadLength = requestedReadLength + 4;
        if (totalReadLength > this.config.dataBufferSize) {
            this.dataBuffer = Buffer.alloc(totalReadLength);
            this.debug(
                `!!!!!!!!!!!! ALLOCATION: increased _data_buffer to Uint8Array(${totalReadLength}) !!!!!!!!!!!!!`
            );
        }

        await this.readInto(this.dataBuffer, totalReadLength);
    }

    private async dataReady() {
        let header = await this.readHeader();

        if (header.channelNumber > 5) {
            this.debug("channel number out of range:", header.channelNumber);
        }

        let ready: boolean;
        if (header.packetByteCount === 0x7FFF) {
            console.log("Byte count is 0x7FFF/0xFFFF; Error?");
            if (header.sequenceNumber === 0xFF) {
                console.log("Sequence number is 0xFF; Error?");
            }
            ready = false;
        } else {
            ready = header.dataLength > 0;
        }

        // this._dbg("\tdata ready", ready);
        return ready;
    }

    private async sendPacket(channel: number, data: Buffer): Promise<number> {
        const dataLength = data.length;
        const writeLength = dataLength + 4;

        const buffer = Buffer.alloc(writeLength);
        buffer.writeUInt16LE(writeLength, 0); // packet length MSB and LSB
        buffer[2] = channel;
        buffer[3] = this.sequenceNumber[channel];

        data.forEach((byte, idx) => {
            // Write the data into the buffer after the header
            buffer[4 + idx] = byte;
        });

        const packet = new Packet(buffer);
        this.debug("Sending packet:");
        this.debug(packet);

        await this.write(buffer);

        this.sequenceNumber[channel] = (this.sequenceNumber[channel] + 1) % 256; // Sequence number per channel that resets after 255
        return this.sequenceNumber[channel];
    }
}