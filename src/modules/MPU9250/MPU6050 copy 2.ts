import { Module } from '../Module';

export class MPU6050 extends Module {
    init(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    static ID_MPU_9250 = 0x71;
    static ID_MPU_9255 = 0x73;

    static I2C_ADDRESS_AD0_LOW = 0x68;
    static I2C_ADDRESS_AD0_HIGH = 0x69;
    static WHO_AM_I = 0x75;

    static SMPLRT_DIV = 0x19;
    static RA_CONFIG = 0x1A;
    static RA_GYRO_CONFIG = 0x1B;
    static RA_ACCEL_CONFIG_1 = 0x1C;
    static RA_ACCEL_CONFIG_2 = 0x1D;

    static RA_INT_PIN_CFG = 0x37;

    static INTCFG_ACTL_BIT = 7;
    static INTCFG_OPEN_BIT = 6;
    static INTCFG_LATCH_INT_EN_BIT = 5;
    static INTCFG_INT_ANYRD_2CLEAR_BIT = 4;
    static INTCFG_ACTL_FSYNC_BIT = 3;
    static INTCFG_FSYNC_INT_MODE_EN_BIT = 2;
    static INTCFG_BYPASS_EN_BIT = 1;
    static INTCFG_NONE_BIT = 0;

    // BY_PASS_MODE= 0x02;
    static ACCEL_XOUT_H = 0x3B;
    static ACCEL_XOUT_L = 0x3C;
    static ACCEL_YOUT_H = 0x3D;
    static ACCEL_YOUT_L = 0x3E;
    static ACCEL_ZOUT_H = 0x3F;
    static ACCEL_ZOUT_L = 0x40;
    static TEMP_OUT_H = 0x41;
    static TEMP_OUT_L = 0x42;
    static GYRO_XOUT_H = 0x43;
    static GYRO_XOUT_L = 0x44;
    static GYRO_YOUT_H = 0x45;
    static GYRO_YOUT_L = 0x46;
    static GYRO_ZOUT_H = 0x47;
    static GYRO_ZOUT_L = 0x48;

    static RA_USER_CTRL = 0x6A;
    static RA_PWR_MGMT_1 = 0x6B;
    static RA_PWR_MGMT_2 = 0x6C;
    static PWR1_DEVICE_RESET_BIT = 7;
    static PWR1_SLEEP_BIT = 6;
    static PWR1_CYCLE_BIT = 5;
    static PWR1_TEMP_DIS_BIT = 3; // (PD_PTAT)
    static PWR1_CLKSEL_BIT = 0;
    static PWR1_CLKSEL_LENGTH = 3;

    static GCONFIG_FS_SEL_BIT = 3;
    static GCONFIG_FS_SEL_LENGTH = 2;
    static GYRO_FS_250 = 0x00;
    static GYRO_FS_500 = 0x01;
    static GYRO_FS_1000 = 0x02;
    static GYRO_FS_2000 = 0x03;
    static GYRO_SCALE_FACTOR = [131, 65.5, 32.8, 16.4];

    static ACONFIG_FS_SEL_BIT = 3;
    static ACONFIG_FS_SEL_LENGTH = 2;
    static ACCEL_FS_2 = 0x00;
    static ACCEL_FS_4 = 0x01;
    static ACCEL_FS_8 = 0x02;
    static ACCEL_FS_16 = 0x03;
    static ACCEL_SCALE_FACTOR = [16384, 8192, 4096, 2048];

    static CLOCK_INTERNAL = 0x00;
    static CLOCK_PLL_XGYRO = 0x01;
    static CLOCK_PLL_YGYRO = 0x02;
    static CLOCK_PLL_ZGYRO = 0x03;
    static CLOCK_KEEP_RESET = 0x07;
    static CLOCK_PLL_EXT32K = 0x04;
    static CLOCK_PLL_EXT19M = 0x05;

    static I2C_SLV0_DO = 0x63;
    static I2C_SLV1_DO = 0x64;
    static I2C_SLV2_DO = 0x65;

    static USERCTRL_DMP_EN_BIT = 7;
    static USERCTRL_FIFO_EN_BIT = 6;
    static USERCTRL_I2C_MST_EN_BIT = 5;
    static USERCTRL_I2C_IF_DIS_BIT = 4;
    static USERCTRL_DMP_RESET_BIT = 3;
    static USERCTRL_FIFO_RESET_BIT = 2;
    static USERCTRL_I2C_MST_RESET_BIT = 1;
    static USERCTRL_SIG_COND_RESET_BIT = 0;

    static DEFAULT_GYRO_OFFSET = { x: 0, y: 0, z: 0 };
    static DEFAULT_ACCEL_CALIBRATION = {
        offset: { x: 0, y: 0, z: 0 },
        scale: {
            x: [-1, 1],
            y: [-1, 1],
            z: [-1, 1],
        }
    };

    /** For Gyro */
    static DLPF_CFG_250HZ = 0x00;
    static DLPF_CFG_184HZ = 0x01;
    static DLPF_CFG_92HZ = 0x02;
    static DLPF_CFG_41HZ = 0x03;
    static DLPF_CFG_20HZ = 0x04;
    static DLPF_CFG_10HZ = 0x05;
    static DLPF_CFG_5HZ = 0x06;
    static DLPF_CFG_3600HZ = 0x07;

    /** Sample rate min/max value */
    static SAMPLERATE_MIN = 5;
    static SAMPLERATE_MAX = 32000;

    /** For accel. */
    static A_DLPF_CFG_460HZ = 0x00;
    static A_DLPF_CFG_184HZ = 0x01;
    static A_DLPF_CFG_92HZ = 0x02;
    static A_DLPF_CFG_41HZ = 0x03;
    static A_DLPF_CFG_20HZ = 0x04;
    static A_DLPF_CFG_10HZ = 0x05;
    static A_DLPF_CFG_5HZ = 0x06;
    static A_DLPF_CFG_460HZ_2 = 0x07;
    static A_DLPF_CFG_MASK = 0x07;
}
