import * as i2c from 'i2c-bus';
import { sleep } from '../../utils';
import { BaseDevice } from './BaseDevice';

interface AK8963Config {
    ak_address: number;
    DEBUG?: boolean;
    scaleValues: boolean;
    // device: string;
    bus: number;
    magCalibration: MagCalibration;
}

interface MagCalibration {
    offset: { x: number, y: number, z: number };
    scale: { x: number, y: number, z: number };
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
    }


    async initialize() {
        this.bus = i2c.openSync(this._config.bus).promisifiedBus();
        await sleep(10);

        const buffer = await this.getIDDevice();

        if (buffer & AK8963.WHO_AM_I_RESPONSE) {
            this.getSensitivityAdjustmentValues();
            await sleep(10);
            this.setCNTL(AK8963.CNTL_MODE_CONTINUE_MEASURE_2);
        } else {
            this.debug.log('ERROR', 'AK8963: Device ID is not equal to 0x' + AK8963.WHO_AM_I_RESPONSE.toString(16) + ', device value is 0x' + buffer.toString(16));
        }
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
        await sleep(10);

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
}