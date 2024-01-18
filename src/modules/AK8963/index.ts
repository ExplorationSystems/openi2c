import * as i2c from 'i2c-bus';
import { sleep } from '../../utils';
import { BaseDevice } from '../BaseDevice';

interface AK8963Config {
    ak_address: number;
    DEBUG?: boolean;
    scaleValues: boolean;
    // device: string;
    bus: number;
    magCalibration: MagCalibration;
}

interface Offset {
    x: number;
    y: number;
    z: number;
}

interface Scale {
    x: number;
    y: number;
    z: number;
}
interface MagCalibration {
    offset: Offset;
    scale: Scale;
}

// AK8963 Map
export const AK8963 = {
    ADDRESS: 0x0C,
    WHO_AM_I: 0x00, // should return 0x48,
    WHO_AM_I_RESPONSE: 0x48,
    INFO: 0x01,
    ST1: 0x02,  // data ready status bit 0
    XOUT_L: 0x03,  // data
    XOUT_H: 0x04,
    YOUT_L: 0x05,
    YOUT_H: 0x06,
    ZOUT_L: 0x07,
    ZOUT_H: 0x08,
    ST2: 0x09,  // Data overflow bit 3 and data read error status bit 2
    CNTL: 0x0A,  // Power down (0000), single-measurement (0001), self-test (1000) and Fuse ROM (1111) modes on bits 3:0
    ASTC: 0x0C,  // Self test control
    I2CDIS: 0x0F,  // I2C disable
    ASAX: 0x10,  // Fuse ROM x-axis sensitivity adjustment value
    ASAY: 0x11,  // Fuse ROM y-axis sensitivity adjustment value
    ASAZ: 0x12,

    ST1_DRDY_BIT: 0,
    ST1_DOR_BIT: 1,

    CNTL_MODE_OFF: 0x00, // Power-down mode
    CNTL_MODE_SINGLE_MEASURE: 0x01, // Single measurement mode
    CNTL_MODE_CONTINUE_MEASURE_1: 0x02, // Continuous measurement mode 1 - Sensor is measured periodically at 8Hz
    CNTL_MODE_CONTINUE_MEASURE_2: 0x06, // Continuous measurement mode 2 - Sensor is measured periodically at 100Hz
    CNTL_MODE_EXT_TRIG_MEASURE: 0x04, // External trigger measurement mode
    CNTL_MODE_SELF_TEST_MODE: 0x08, // Self-test mode
    CNTL_MODE_FUSE_ROM_ACCESS: 0x0F,  // Fuse ROM access mode

    DEFAULT_CALIBRATION: {
        offset: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
    }
};

export class ak8963 extends BaseDevice {
    private _config: AK8963Config;
    private asax!: number;
    private asay!: number;
    private asaz!: number;

    constructor(config: Partial<AK8963Config> = {}) {
        super();

        this._config = {
            // device: '/dev/i2c-0',
            bus: 0,
            ak_address: AK8963.ADDRESS,
            scaleValues: false,
            magCalibration: AK8963.DEFAULT_CALIBRATION,
            ...config,
        }

        this.address = this._config.ak_address;
    }

    async initialize() {
        this.bus = i2c.openSync(this._config.bus).promisifiedBus();
        await sleep(100);

        const buffer = await this.getIDDevice();

        if (buffer & AK8963.WHO_AM_I_RESPONSE) {
            this.getSensitivityAdjustmentValues();
            await sleep(100);
            this.setCNTL(AK8963.CNTL_MODE_CONTINUE_MEASURE_2);
        } else {
            this.debug.log('ERROR', 'AK8963: Device ID is not equal to 0x' + AK8963.WHO_AM_I_RESPONSE.toString(16) + ', device value is 0x' + buffer.toString(16));
        }
    }

    async getMagAttitude() {
        // Get the actual data
        const buffer = await this.readBytes(AK8963.XOUT_L, 6);
        const cal = this._config.magCalibration;

        // For some reason when we read ST2 (Status 2) just after reading byte, this ensures the
        // next reading is fresh.  If we do it before without a pause, only 1 in 15 readings will
        // be fresh.  The setTimeout ensures this read goes to the back of the queue, once all other
        // computation is done.
        process.nextTick(() => this.readByte(AK8963.ST2));

        return [
            ((buffer.readInt16LE(0) * this.asax) - cal.offset.x) * cal.scale.x,
            ((buffer.readInt16LE(2) * this.asay) - cal.offset.y) * cal.scale.y,
            ((buffer.readInt16LE(4) * this.asaz) - cal.offset.z) * cal.scale.z
        ];
    }

    async printSettings() {
        const MODE_LST: Record<number, string> = {
            0: '0x00 (Power-down mode)',
            1: '0x01 (Single measurement mode)',
            2: '0x02 (Continuous measurement mode 1: 8Hz)',
            6: '0x06 (Continuous measurement mode 2: 100Hz)',
            4: '0x04 (External trigger measurement mode)',
            8: '0x08 (Self-test mode)',
            15: '0x0F (Fuse ROM access mode)'
        };

        this.debug.log('INFO', 'Magnetometer (Compass):');
        this.debug.log('INFO', '--> i2c address: 0x' + this._config.ak_address.toString(16));
        this.debug.log('INFO', '--> Device ID: 0x' + (await this.getIDDevice()).toString(16));
        this.debug.log('INFO', '--> Mode: ' + MODE_LST[(await this.getCNTL()) & 0x0F]);
        this.debug.log('INFO', '--> Scalars:');
        this.debug.log('INFO', '  --> x: ' + this.asax);
        this.debug.log('INFO', '  --> y: ' + this.asay);
        this.debug.log('INFO', '  --> z: ' + this.asaz);
    }

    /**
     * Get the Sensitivity Adjustment values.  These were set during manufacture and allow us to get the actual H values
     * from the magnetometer.
     */
    async getSensitivityAdjustmentValues() {
        if (!this._config.scaleValues) {
            this.asax = 1;
            this.asay = 1;
            this.asaz = 1;
            return;
        }

        // Need to set to Fuse mode to get valid values from this.
        var currentMode = await this.getCNTL();
        this.setCNTL(AK8963.CNTL_MODE_FUSE_ROM_ACCESS);
        await sleep(100);

        // Get the ASA* values
        this.asax = ((await this.readByte(AK8963.ASAX) - 128) * 0.5 / 128 + 1);
        this.asay = ((await this.readByte(AK8963.ASAY) - 128) * 0.5 / 128 + 1);
        this.asaz = ((await this.readByte(AK8963.ASAZ) - 128) * 0.5 / 128 + 1);

        // Return the mode we were in before
        this.setCNTL(currentMode);
    }

    async getCNTL() {
        return await this.readByte(AK8963.CNTL);
    }

    /**
     * CNTL_MODE_OFF: 0x00, // Power-down mode
     * CNTL_MODE_SINGLE_MEASURE: 0x01, // Single measurement mode
     * CNTL_MODE_CONTINUE_MEASURE_1: 0x02, // Continuous measurement mode 1
     * CNTL_MODE_CONTINUE_MEASURE_2: 0x06, // Continuous measurement mode 2
     * CNTL_MODE_EXT_TRIG_MEASURE: 0x04, // External trigger measurement mode
     * CNTL_MODE_SELF_TEST_MODE: 0x08, // Self-test mode
     * CNTL_MODE_FUSE_ROM_ACCESS: 0x0F  // Fuse ROM access mode
     */
    async setCNTL(mode: number) {
        return await this.writeByte(AK8963.CNTL, mode);
    }

    async getIDDevice() {
        return await this.readByte(AK8963.WHO_AM_I);
    }

    async getDataReady(){
        return await this.readBit(AK8963.ST1, AK8963.ST1_DRDY_BIT);
    }
}