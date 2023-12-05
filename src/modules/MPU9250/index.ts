import * as i2c from 'i2c-bus';
import { sleep } from '../../utils';
import { debug } from '../../debug';
import { Module } from '../Module';

const log = debug.extend('MPU9250');

export class MPU9250 extends Module {
    // Accelerometer and Gyroscope Registers
    static MPU9250_ADDRESS = 0x68;
    // 0x3B through 0x40 are X, Y, and Z Accelerometer
    static ACCEL_XOUT_H = 0x3b;
    static ACCEL_XOUT_L = 0x3c;
    static ACCEL_YOUT_H = 0x3d;
    static ACCEL_YOUT_L = 0x3e;
    static ACCEL_ZOUT_H = 0x3f;
    static ACCEL_ZOUT_L = 0x40;
    // 0x41 through 0x42 are Temperature
    static TEMP_OUT_H = 0x41;
    static TEMP_OUT_L = 0x42;

    // 0x43 through 0x48 are X, Y, and Z Gyroscope
    static GYRO_XOUT_H = 0x43;
    static GYRO_XOUT_L = 0x44;
    static GYRO_YOUT_H = 0x45;
    static GYRO_YOUT_L = 0x46;
    static GYRO_ZOUT_H = 0x47;
    static GYRO_ZOUT_L = 0x48;
    static PWR_MGMT_1 = 0x6b;

    // Magnetometer Registers
    static AK8963_ADDRESS = 0x0c;

    // 0x03 through 0x08 are X, Y, and Z Magnetometer
    static AK8963_XOUT_L = 0x03;
    static AK8963_XOUT_H = 0x04;
    static AK8963_YOUT_L = 0x05;
    static AK8963_YOUT_H = 0x06;
    static AK8963_ZOUT_L = 0x07;
    static AK8963_ZOUT_H = 0x08;

    // 0x0A is Control register
    static AK8963_CNTL = 0x0a;
    // 0x0B is Status register
    static AK8963_ST1 = 0x0b;
    // 0x0C is Measurement data available register
    static AK8963_ST2 = 0x0c;
    // 0x10 through 0x12 are Fuse ROM X, Y, Z sensitivity adjustment value
    static AK8963_ASAX = 0x10;
    static AK8963_ASAY = 0x11;
    static AK8963_ASAZ = 0x12;

    async init() {
        await this.bus.writeByte(MPU9250.MPU9250_ADDRESS, MPU9250.PWR_MGMT_1, 0x00); // PWR_MGMT_1 register
    }

    async readAccelerometer(): Promise<{ x: number; y: number; z: number }> {
        // Read accelerometer values, reads the low and high byte into a contiguous 16-bit value
        const x = await this.bus.readWord(MPU9250.MPU9250_ADDRESS, MPU9250.ACCEL_XOUT_H);
        const y = await this.bus.readWord(MPU9250.MPU9250_ADDRESS, MPU9250.ACCEL_YOUT_H);
        const z = await this.bus.readWord(MPU9250.MPU9250_ADDRESS, MPU9250.ACCEL_ZOUT_H);

        return { x, y, z };
    }
}
