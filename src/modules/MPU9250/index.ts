import * as i2c from 'i2c-bus';
import { sleep } from '../../utils';
import { debug } from '../../debug';
import { Module } from '../Module';

const log = debug.extend('MPU9250');

export class MPU9250 extends Module {
    static MPU9250 = {
        ID_MPU_9250: 0x71,
        ID_MPU_9255: 0x73,

        I2C_ADDRESS_AD0_LOW: 0x68,
        I2C_ADDRESS_AD0_HIGH: 0x69,
        WHO_AM_I: 0x75,

        SMPLRT_DIV: 0x19,
        RA_CONFIG: 0x1a,
        RA_GYRO_CONFIG: 0x1b,
        RA_ACCEL_CONFIG_1: 0x1c,
        RA_ACCEL_CONFIG_2: 0x1d,

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

        ACCEL_XOUT_H: 0x3b,
        ACCEL_XOUT_L: 0x3c,
        ACCEL_YOUT_H: 0x3d,
        ACCEL_YOUT_L: 0x3e,
        ACCEL_ZOUT_H: 0x3f,
        ACCEL_ZOUT_L: 0x40,
        TEMP_OUT_H: 0x41,
        TEMP_OUT_L: 0x42,
        GYRO_XOUT_H: 0x43,
        GYRO_XOUT_L: 0x44,
        GYRO_YOUT_H: 0x45,
        GYRO_YOUT_L: 0x46,
        GYRO_ZOUT_H: 0x47,
        GYRO_ZOUT_L: 0x48,

        RA_USER_CTRL: 0x6a,
        RA_PWR_MGMT_1: 0x6b,
        RA_PWR_MGMT_2: 0x6c,
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

    static AK8963 = {
        ADDRESS: 0x0c,
        WHO_AM_I: 0x00, // should return 0x48,
        WHO_AM_I_RESPONSE: 0x48,
        INFO: 0x01,
        ST1: 0x02, // data ready status bit 0
        XOUT_L: 0x03, // data
        XOUT_H: 0x04,
        YOUT_L: 0x05,
        YOUT_H: 0x06,
        ZOUT_L: 0x07,
        ZOUT_H: 0x08,
        ST2: 0x09, // Data overflow bit 3 and data read error status bit 2
        CNTL: 0x0a, // Power down (0000), single-measurement (0001), self-test (1000) and Fuse ROM (1111) modes on bits 3:0
        ASTC: 0x0c, // Self test control
        I2CDIS: 0x0f, // I2C disable
        ASAX: 0x10, // Fuse ROM x-axis sensitivity adjustment value
        ASAY: 0x11, // Fuse ROM y-axis sensitivity adjustment value
        ASAZ: 0x12,

        ST1_DRDY_BIT: 0,
        ST1_DOR_BIT: 1,

        CNTL_MODE_OFF: 0x00, // Power-down mode
        CNTL_MODE_SINGLE_MEASURE: 0x01, // Single measurement mode
        CNTL_MODE_CONTINUE_MEASURE_1: 0x02, // Continuous measurement mode 1 - Sensor is measured periodically at 8Hz
        CNTL_MODE_CONTINUE_MEASURE_2: 0x06, // Continuous measurement mode 2 - Sensor is measured periodically at 100Hz
        CNTL_MODE_EXT_TRIG_MEASURE: 0x04, // External trigger measurement mode
        CNTL_MODE_SELF_TEST_MODE: 0x08, // Self-test mode
        CNTL_MODE_FUSE_ROM_ACCESS: 0x0f, // Fuse ROM access mode

        DEFAULT_CALIBRATION: {
            offset: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
        }
    };

    async init() {}
}
