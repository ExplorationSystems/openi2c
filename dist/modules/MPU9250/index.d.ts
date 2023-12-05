import { Module } from '../Module';
export declare class MPU9250 extends Module {
    static MPU9250_ADDRESS: number;
    static ACCEL_XOUT_H: number;
    static ACCEL_XOUT_L: number;
    static ACCEL_YOUT_H: number;
    static ACCEL_YOUT_L: number;
    static ACCEL_ZOUT_H: number;
    static ACCEL_ZOUT_L: number;
    static TEMP_OUT_H: number;
    static TEMP_OUT_L: number;
    static GYRO_XOUT_H: number;
    static GYRO_XOUT_L: number;
    static GYRO_YOUT_H: number;
    static GYRO_YOUT_L: number;
    static GYRO_ZOUT_H: number;
    static GYRO_ZOUT_L: number;
    static PWR_MGMT_1: number;
    static AK8963_ADDRESS: number;
    static AK8963_XOUT_L: number;
    static AK8963_XOUT_H: number;
    static AK8963_YOUT_L: number;
    static AK8963_YOUT_H: number;
    static AK8963_ZOUT_L: number;
    static AK8963_ZOUT_H: number;
    static AK8963_CNTL: number;
    static AK8963_ST1: number;
    static AK8963_ST2: number;
    static AK8963_ASAX: number;
    static AK8963_ASAY: number;
    static AK8963_ASAZ: number;
    init(): Promise<void>;
    readAccelerometer(): Promise<{
        x: number;
        y: number;
        z: number;
    }>;
}
