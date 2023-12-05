"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MPU9250 = void 0;
const debug_1 = require("../../debug");
const Module_1 = require("../Module");
const log = debug_1.debug.extend('MPU9250');
class MPU9250 extends Module_1.Module {
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.bus.writeByte(MPU9250.MPU9250_ADDRESS, MPU9250.PWR_MGMT_1, 0x00); // PWR_MGMT_1 register
        });
    }
    readAccelerometer() {
        return __awaiter(this, void 0, void 0, function* () {
            // Read accelerometer values, reads the low and high byte into a contiguous 16-bit value
            const x = yield this.bus.readWord(MPU9250.MPU9250_ADDRESS, MPU9250.ACCEL_XOUT_H);
            const y = yield this.bus.readWord(MPU9250.MPU9250_ADDRESS, MPU9250.ACCEL_YOUT_H);
            const z = yield this.bus.readWord(MPU9250.MPU9250_ADDRESS, MPU9250.ACCEL_ZOUT_H);
            return { x, y, z };
        });
    }
}
exports.MPU9250 = MPU9250;
// Accelerometer and Gyroscope Registers
MPU9250.MPU9250_ADDRESS = 0x68;
// 0x3B through 0x40 are X, Y, and Z Accelerometer
MPU9250.ACCEL_XOUT_H = 0x3b;
MPU9250.ACCEL_XOUT_L = 0x3c;
MPU9250.ACCEL_YOUT_H = 0x3d;
MPU9250.ACCEL_YOUT_L = 0x3e;
MPU9250.ACCEL_ZOUT_H = 0x3f;
MPU9250.ACCEL_ZOUT_L = 0x40;
// 0x41 through 0x42 are Temperature
MPU9250.TEMP_OUT_H = 0x41;
MPU9250.TEMP_OUT_L = 0x42;
// 0x43 through 0x48 are X, Y, and Z Gyroscope
MPU9250.GYRO_XOUT_H = 0x43;
MPU9250.GYRO_XOUT_L = 0x44;
MPU9250.GYRO_YOUT_H = 0x45;
MPU9250.GYRO_YOUT_L = 0x46;
MPU9250.GYRO_ZOUT_H = 0x47;
MPU9250.GYRO_ZOUT_L = 0x48;
MPU9250.PWR_MGMT_1 = 0x6b;
// Magnetometer Registers
MPU9250.AK8963_ADDRESS = 0x0c;
// 0x03 through 0x08 are X, Y, and Z Magnetometer
MPU9250.AK8963_XOUT_L = 0x03;
MPU9250.AK8963_XOUT_H = 0x04;
MPU9250.AK8963_YOUT_L = 0x05;
MPU9250.AK8963_YOUT_H = 0x06;
MPU9250.AK8963_ZOUT_L = 0x07;
MPU9250.AK8963_ZOUT_H = 0x08;
// 0x0A is Control register
MPU9250.AK8963_CNTL = 0x0a;
// 0x0B is Status register
MPU9250.AK8963_ST1 = 0x0b;
// 0x0C is Measurement data available register
MPU9250.AK8963_ST2 = 0x0c;
// 0x10 through 0x12 are Fuse ROM X, Y, Z sensitivity adjustment value
MPU9250.AK8963_ASAX = 0x10;
MPU9250.AK8963_ASAY = 0x11;
MPU9250.AK8963_ASAZ = 0x12;
