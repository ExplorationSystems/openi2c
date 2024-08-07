import { BNO_HEADER_LEN } from "./constants";

export class PacketError extends Error { }

export class PacketHeader {
    readonly channelNumber: number;
    readonly sequenceNumber: number;
    readonly dataLength: number;
    readonly packetByteCount: number;
    readonly data: Buffer;

    constructor(data: Buffer) {
        this.data = data.subarray(0, BNO_HEADER_LEN);
        this.packetByteCount = data.readUInt16LE(0) & ~0x8000;
        this.channelNumber = data.readUInt8(2);
        this.sequenceNumber = data.readUInt8(3);
        this.dataLength = Math.max(0, this.packetByteCount - 4);
    }
}

export class Packet {
    readonly header: PacketHeader;
    readonly data: Buffer;

    constructor(data: Buffer) {
        this.header = Packet.headerFromBuffer(data);
        const dataEndIndex = this.header.dataLength + BNO_HEADER_LEN;
        this.data = data.subarray(BNO_HEADER_LEN, dataEndIndex);
    }

    // toString(): string {
    //     let length = this.header.packetByteCount;
    //     let outstr = "\n\t\t********** Packet *************\n";
    //     outstr += "DBG::\t\t HEADER:\n";

    //     outstr += `DBG::\t\t Data Len: ${this.header.dataLength}\n`;
    //     outstr += `DBG::\t\t Channel: ${channels[this.channelNumber]} (${this.channelNumber})\n`;

    //     if ([BNO_CHANNEL_CONTROL, BNO_CHANNEL_INPUT_SENSOR_REPORTS].includes(this.channelNumber)) {
    //         if (this.report_id in reports) {
    //             outstr += `DBG::\t\t \tReport Type: ${reports[this.report_id]} (0x${this.report_id.toString(16)})\n`;
    //         } else {
    //             outstr += `DBG::\t\t \t** UNKNOWN Report Type **: ${this.report_id.toString(16)}\n`;
    //         }

    //         if (this.report_id > 0xF0 && this.data.length >= 6 && this.data[5] in reports) {
    //             outstr += `DBG::\t\t \tSensor Report Type: ${reports[this.data[5]]}(${this.data[5].toString(16)})\n`;
    //         }

    //         if (this.report_id == 0xFC && this.data.length >= 6 && this.data[1] in reports) {
    //             outstr += `DBG::\t\t \tEnabled Feature: ${reports[this.data[1]]}(${this.data[5].toString(16)})\n`;
    //         }
    //     }

    //     outstr += `DBG::\t\t Sequence number: ${this.header.sequenceNumber}\n`;
    //     outstr += "\n";
    //     outstr += "DBG::\t\t Data:";

    //     for (let idx = 0; idx < this.data.slice(0, length).length; idx++) {
    //         let packet_byte = this.data[idx];
    //         let packet_index = idx + 4;
    //         if (packet_index % 4 === 0) {
    //             outstr += `\nDBG::\t\t[0x${packet_index.toString(16)}] `;
    //         }
    //         outstr += `0x${packet_byte.toString(16)} `;
    //     }
    //     outstr += "\n";
    //     outstr += "\t\t*******************************\n";

    //     return outstr;
    // }

    // The Packet's Report ID
    get reportId(): number {
        return this.data[0];
    }

    // The packet channel
    get channelNumber(): number {
        return this.header.channelNumber;
    }

    static headerFromBuffer(packetBytes: Buffer): PacketHeader {
        return new PacketHeader(packetBytes);
    }

    static isError(header: PacketHeader): boolean {
        if (header.channelNumber > 5) {
            return true;
        }
        if (header.packetByteCount === 0xFFFF && header.sequenceNumber === 0xFF) {
            return true;
        }
        return false;
    }
}