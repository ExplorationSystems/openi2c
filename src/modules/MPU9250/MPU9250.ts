import * as i2c from 'i2c-bus';
import { sleep } from '../../utils';
import { AK8963, ak8963 } from './AK8963';
import { BaseDevice } from './BaseDevice';

// Interface for MPU9250 configuration
interface MPU9250Config {
    // device: string;
    bus: number;
    address: number;
    UpMagneto: boolean;
    DEBUG: boolean;
    scaleValues: boolean;
    ak_address: number;
    GYRO_FS: number;
    ACCEL_FS: number;
    gyroBiasOffset: Offset;
    accelCalibration: AccelCalibration;
    DLPF_CFG?: number;
    A_DLPF_CFG?: number;
    SAMPLE_RATE?: number;
}

// Interface for Offset
interface Offset {
    x: number;
    y: number;
    z: number;
}

// Interface for AccelCalibration
interface AccelCalibration {
    offset: Offset;
    scale: Scale;
}

// Interface for Scale
interface Scale {
    x: number[];
    y: number[];
    z: number[];
}

// MPU9250 Map
export const MPU9250 = {

    ID_MPU_9250: 0x71,
    ID_MPU_9255: 0x73,

    I2C_ADDRESS_AD0_LOW: 0x68,
    I2C_ADDRESS_AD0_HIGH: 0x69,
    WHO_AM_I: 0x75,

    SMPLRT_DIV: 0x19,
    RA_CONFIG: 0x1A,
    RA_GYRO_CONFIG: 0x1B,
    RA_ACCEL_CONFIG_1: 0x1C,
    RA_ACCEL_CONFIG_2: 0x1D,

    RA_INT_PIN_CFG: 0x37,

    INTCFG_ACTL_BIT: 7,
    INTCFG_OPEN_BIT: 6,
    INTCFG_LATCH_INT_EN_BIT: 5,
    INTCFG_INT_ANYRD_2CLEAR_BIT: 4,
    INTCFG_ACTL_FSYNC_BIT: 3,
    INTCFG_FSYNC_INT_MODE_EN_BIT: 2,
    INTCFG_BYPASS_EN_BIT: 1,
    INTCFG_NONE_BIT: 0,

    // BY_PASS_MODE: 0x02,

    ACCEL_XOUT_H: 0x3B,
    ACCEL_XOUT_L: 0x3C,
    ACCEL_YOUT_H: 0x3D,
    ACCEL_YOUT_L: 0x3E,
    ACCEL_ZOUT_H: 0x3F,
    ACCEL_ZOUT_L: 0x40,
    TEMP_OUT_H: 0x41,
    TEMP_OUT_L: 0x42,
    GYRO_XOUT_H: 0x43,
    GYRO_XOUT_L: 0x44,
    GYRO_YOUT_H: 0x45,
    GYRO_YOUT_L: 0x46,
    GYRO_ZOUT_H: 0x47,
    GYRO_ZOUT_L: 0x48,

    RA_USER_CTRL: 0x6A,
    RA_PWR_MGMT_1: 0x6B,
    RA_PWR_MGMT_2: 0x6C,
    PWR1_DEVICE_RESET_BIT: 7,
    PWR1_SLEEP_BIT: 6,
    PWR1_CYCLE_BIT: 5,
    PWR1_TEMP_DIS_BIT: 3, // (PD_PTAT)
    PWR1_CLKSEL_BIT: 0,
    PWR1_CLKSEL_LENGTH: 3,

    GCONFIG_FS_SEL_BIT: 3,
    GCONFIG_FS_SEL_LENGTH: 2,
    GYRO_FS_250: 0x00,
    GYRO_FS_500: 0x01,
    GYRO_FS_1000: 0x02,
    GYRO_FS_2000: 0x03,
    GYRO_SCALE_FACTOR: [131, 65.5, 32.8, 16.4],

    ACONFIG_FS_SEL_BIT: 3,
    ACONFIG_FS_SEL_LENGTH: 2,
    ACCEL_FS_2: 0x00,
    ACCEL_FS_4: 0x01,
    ACCEL_FS_8: 0x02,
    ACCEL_FS_16: 0x03,
    ACCEL_SCALE_FACTOR: [16384, 8192, 4096, 2048],

    CLOCK_INTERNAL: 0x00,
    CLOCK_PLL_XGYRO: 0x01,
    CLOCK_PLL_YGYRO: 0x02,
    CLOCK_PLL_ZGYRO: 0x03,
    CLOCK_KEEP_RESET: 0x07,
    CLOCK_PLL_EXT32K: 0x04,
    CLOCK_PLL_EXT19M: 0x05,

    I2C_SLV0_DO: 0x63,
    I2C_SLV1_DO: 0x64,
    I2C_SLV2_DO: 0x65,

    USERCTRL_DMP_EN_BIT: 7,
    USERCTRL_FIFO_EN_BIT: 6,
    USERCTRL_I2C_MST_EN_BIT: 5,
    USERCTRL_I2C_IF_DIS_BIT: 4,
    USERCTRL_DMP_RESET_BIT: 3,
    USERCTRL_FIFO_RESET_BIT: 2,
    USERCTRL_I2C_MST_RESET_BIT: 1,
    USERCTRL_SIG_COND_RESET_BIT: 0,

    DEFAULT_GYRO_OFFSET: { x: 0, y: 0, z: 0 },
    DEFAULT_ACCEL_CALIBRATION: {
        offset: { x: 0, y: 0, z: 0 },
        scale: {
            x: [-1, 1],
            y: [-1, 1],
            z: [-1, 1]
        }
    },

    /** For Gyro */
    DLPF_CFG_250HZ: 0x00,
    DLPF_CFG_184HZ: 0x01,
    DLPF_CFG_92HZ: 0x02,
    DLPF_CFG_41HZ: 0x03,
    DLPF_CFG_20HZ: 0x04,
    DLPF_CFG_10HZ: 0x05,
    DLPF_CFG_5HZ: 0x06,
    DLPF_CFG_3600HZ: 0x07,

    /** Sample rate min/max value */
    SAMPLERATE_MIN: 5,
    SAMPLERATE_MAX: 32000,

    /** For accel. */
    A_DLPF_CFG_460HZ: 0x00,
    A_DLPF_CFG_184HZ: 0x01,
    A_DLPF_CFG_92HZ: 0x02,
    A_DLPF_CFG_41HZ: 0x03,
    A_DLPF_CFG_20HZ: 0x04,
    A_DLPF_CFG_10HZ: 0x05,
    A_DLPF_CFG_5HZ: 0x06,
    A_DLPF_CFG_460HZ_2: 0x07,
    A_DLPF_CFG_MASK: 0x07
};



// mpu9250 class
class mpu9250 extends BaseDevice {
    private _config: MPU9250Config;
    // private i2c: any; // Specify the correct type for i2c
    private gyroScalarInv!: number;
    private accelScalarInv!: number;
    private ak8963?: ak8963;
    // other properties as needed

    constructor(config: Partial<MPU9250Config> = {}) {
        super();
        this._config = {
            // device: '/dev/i2c-0',
            bus: 0,
            address: MPU9250.I2C_ADDRESS_AD0_LOW,
            UpMagneto: false,
            DEBUG: false,
            scaleValues: false,
            ak_address: AK8963.ADDRESS,
            GYRO_FS: 0,
            ACCEL_FS: 2,
            gyroBiasOffset: MPU9250.DEFAULT_GYRO_OFFSET,
            accelCalibration: MPU9250.DEFAULT_ACCEL_CALIBRATION,
            ...config,
        }

        this.address = this._config.address;
    }

    public async initialize() {
        this.bus = i2c.openSync(this._config.bus).promisifiedBus(); //new MOD_I2C(this._config.address, { device: this._config.device });
        // this.debug = new debugConsole(this._config.DEBUG);
        this.debug.log('INFO', 'Initialization MPU9250 ....');

        // Clear configuration
        await this.writeBit(MPU9250.RA_PWR_MGMT_1, MPU9250.PWR1_DEVICE_RESET_BIT, 1);
        this.debug.log('INFO', 'Reset configuration MPU9250.');
        await sleep(10);

        // defined sample rate
        if (
            'SAMPLE_RATE' in this._config
            && this._config.SAMPLE_RATE
            && (
                this._config.SAMPLE_RATE > MPU9250.SAMPLERATE_MIN
                && this._config.SAMPLE_RATE < MPU9250.SAMPLERATE_MAX
            )
        ) {
            await this.setSampleRate(this._config.SAMPLE_RATE);
            await sleep(100);
        }

        // Define DLPF_CFG
        if ('DLPF_CFG' in this._config && this._config.DLPF_CFG) {
            await this.setDLPFConfig(this._config.DLPF_CFG);
            await sleep(100);
        }

        // define A_DLPF_CFG
        if ('A_DLPF_CFG' in this._config && this._config.A_DLPF_CFG) {
            await this.setAccelDLPFConfig(this._config.A_DLPF_CFG);
            await sleep(100);
        }

        // define clock source
        this.setClockSource(MPU9250.CLOCK_PLL_XGYRO);
        await sleep(10);

        // define gyro range
        var gyro_fs = [MPU9250.GYRO_FS_250, MPU9250.GYRO_FS_500, MPU9250.GYRO_FS_1000, MPU9250.GYRO_FS_2000];
        var gyro_value = MPU9250.GYRO_FS_250;
        if (this._config.GYRO_FS > -1 && this._config.GYRO_FS < 4) gyro_value = gyro_fs[this._config.GYRO_FS];
        await this.setFullScaleGyroRange(gyro_value);
        await sleep(10);

        // define accel range
        var accel_fs = [MPU9250.ACCEL_FS_2, MPU9250.ACCEL_FS_4, MPU9250.ACCEL_FS_8, MPU9250.ACCEL_FS_16];
        var accel_value = MPU9250.ACCEL_FS_4;
        if (this._config.ACCEL_FS > -1 && this._config.ACCEL_FS < 4) accel_value = accel_fs[this._config.ACCEL_FS];
        await this.setFullScaleAccelRange(accel_value);
        await sleep(10);

        // disable sleepEnabled
        await this.setSleepEnabled(false);
        await sleep(10);

        if (this._config.UpMagneto) {
            this.debug.log('INFO', 'Enabled magnetometer. Starting initialization ....');
            this.enableMagnetometer();
            this.debug.log('INFO', 'END of magnetometer initialization.');
        }

        this.debug.log('INFO', 'END of MPU9150 initialization.');

        // Print out the configuration
        if (this._config.DEBUG) {
            await this.printSettings();
            this.printAccelSettings();
            this.printGyroSettings();
            if (this.ak8963) {
                this.ak8963.printSettings();
            }
        }

        return this.testDevice();
    }

    async printSettings() {
        var CLK_RNG = [
            '0 (Internal 20MHz oscillator)',
            '1 (Auto selects the best available clock source)',
            '2 (Auto selects the best available clock source)',
            '3 (Auto selects the best available clock source)',
            '4 (Auto selects the best available clock source)',
            '5 (Auto selects the best available clock source)',
            '6 (Internal 20MHz oscillator)',
            '7 (Stops the clock and keeps timing generator in reset)'
        ];
        this.debug.log('INFO', 'MPU9250:');
        this.debug.log('INFO', '--> Device address: 0x' + this._config.address.toString(16));
        this.debug.log('INFO', '--> i2c bus: 0x' + (await this.getIDDevice()).toString(16));
        this.debug.log('INFO', '--> Device ID: 0x' + (await this.getIDDevice()).toString(16));
        this.debug.log('INFO', '--> BYPASS enabled: ' + ((await this.getByPASSEnabled()) ? 'Yes' : 'No'));
        this.debug.log('INFO', '--> SleepEnabled Mode: ' + ((await this.getSleepEnabled()) === 1 ? 'On' : 'Off'));
        this.debug.log('INFO', '--> i2c Master Mode: ' + ((await this.getI2CMasterMode()) === 1 ? 'Enabled' : 'Disabled'));
        this.debug.log('INFO', '--> Power Management (0x6B, 0x6C):');
        this.debug.log('INFO', '  --> Clock Source: ' + CLK_RNG[await this.getClockSource()]);
        this.debug.log('INFO', '  --> Accel enabled (x, y, z): ' + this.vectorToYesNo(await this.getAccelPowerSettings()));
        this.debug.log('INFO', '  --> Gyro enabled (x, y, z): ' + this.vectorToYesNo(await this.getGyroPowerSettings()));

    }
    
    async getGyroPowerSettings() {
        var byte = await this.readByte(MPU9250.RA_PWR_MGMT_2);
        byte = byte & 0x07;
        
        return [
            (byte >> 2) & 1,    // X
            (byte >> 1) & 1,    // Y
            (byte >> 0) & 1	    // Z
        ];
    }

    async getAccelPowerSettings() {
        var byte = await this.readByte(MPU9250.RA_PWR_MGMT_2);
        byte = byte & 0x38;
        
        return [
            (byte >> 5) & 1,    // X
            (byte >> 4) & 1,    // Y
            (byte >> 3) & 1	    // Z
        ];
    }

    async getClockSource() {
        return await this.readByte(MPU9250.RA_PWR_MGMT_1) & 0x07;
    }

    async getI2CMasterMode() {
        return await this.readBit(MPU9250.RA_USER_CTRL, MPU9250.USERCTRL_I2C_MST_EN_BIT);
    }

    async getSleepEnabled() {
        return await this.readBit(MPU9250.RA_PWR_MGMT_1, MPU9250.PWR1_SLEEP_BIT)
    }

    async getIDDevice() {
        return await this.readByte(MPU9250.WHO_AM_I);
    }

    async setSampleRate(sample_rate: number) {
        if (sample_rate < MPU9250.SAMPLERATE_MAX && sample_rate >= 8000) {
            sample_rate = 8000;
        }
        if (sample_rate < 8000 && sample_rate > 1000) {
            sample_rate = 1000;
        }
        if (sample_rate < 1000) {
            sample_rate = 1000 / (1 + sample_rate);
        }

        await this.writeBits(MPU9250.SMPLRT_DIV, 0, 8, sample_rate).catch((r) => {
            this.debug.log('ERROR', 'setSampleRate ' + r.message);
        });
    }

    async enableMagnetometer() {
        await this.setI2CMasterModeEnabled(false);
        await sleep(100);

        await this.setByPASSEnabled(true);
        await sleep(100);

        if (await this.getByPASSEnabled()) {
            this.ak8963 = new ak8963(this._config);
            await this.ak8963.initialize();
        } else {
            this.debug.log('ERROR', 'Can\'t turn on RA_INT_PIN_CFG.');
        }
    }

    async getByPASSEnabled() {
        return this.readBit(MPU9250.RA_INT_PIN_CFG, MPU9250.INTCFG_BYPASS_EN_BIT);
    }

    async setByPASSEnabled(bool: boolean) {
        var val = bool ? 1 : 0;
        await this.writeBit(MPU9250.RA_INT_PIN_CFG, MPU9250.INTCFG_BYPASS_EN_BIT, val);
    }

    async setI2CMasterModeEnabled(bool: boolean) {
        var val = bool ? 1 : 0;
        await this.writeBit(MPU9250.RA_USER_CTRL, MPU9250.USERCTRL_I2C_MST_EN_BIT, val);
    }

    async setSleepEnabled(bool: boolean) {
        var val = bool ? 1 : 0;
        await this.writeBit(MPU9250.RA_PWR_MGMT_1, MPU9250.PWR1_SLEEP_BIT, val);
    }

    async setFullScaleAccelRange(adrs: number) {
        if (this._config.scaleValues) {
            this.accelScalarInv = 1 / MPU9250.ACCEL_SCALE_FACTOR[adrs];
        } else {
            this.accelScalarInv = 1;
        }

        await this.writeBits(MPU9250.RA_ACCEL_CONFIG_1, MPU9250.ACONFIG_FS_SEL_BIT, MPU9250.ACONFIG_FS_SEL_LENGTH, adrs);

    }

    async setFullScaleGyroRange(adrs: number) {
        if (this._config.scaleValues) {
            this.gyroScalarInv = 1 / MPU9250.GYRO_SCALE_FACTOR[adrs];
        } else {
            this.gyroScalarInv = 1;
        }

        await this.writeBits(MPU9250.RA_GYRO_CONFIG, MPU9250.GCONFIG_FS_SEL_BIT, MPU9250.GCONFIG_FS_SEL_LENGTH, adrs);
    }

    async setClockSource(adrs: number) {
        await this.writeBits(MPU9250.RA_PWR_MGMT_1, MPU9250.PWR1_CLKSEL_BIT, MPU9250.PWR1_CLKSEL_LENGTH, adrs);
    }

    async setDLPFConfig(dlpf_cfg: number) {
        await this.writeBits(MPU9250.RA_CONFIG, 0, 3, dlpf_cfg).catch((r) => {
            this.debug.log('ERROR', 'setDLPFConfig ' + r.message);
        });
    }

    async setAccelDLPFConfig(a_dlpf_cfg: number) {
        await this.writeBits(MPU9250.RA_ACCEL_CONFIG_2, 0, 4, a_dlpf_cfg).catch((r) => {
            this.debug.log('ERROR', 'setAccelDLPFConfig ' + r.message);
        });
    }
}

// Other classes (ak8963, debugConsole, etc.) and their methods with type annotations

// Export the module
export default mpu9250;