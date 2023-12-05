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
exports.PCA9685 = void 0;
const utils_1 = require("../../utils");
const debug_1 = require("../../debug");
const Module_1 = require("../Module");
const log = debug_1.debug.extend('PCA9685');
class PCA9685 extends Module_1.Module {
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO What configuration is needed?
            yield this.setFrequency(50);
        });
    }
    setDutyCycle(channel, dutyCycle) {
        return __awaiter(this, void 0, void 0, function* () {
            dutyCycle = Math.min(1, Math.max(0, dutyCycle)); // Clamp to [0,1]
            log(`Set duty cycle for channel ${channel} to ${dutyCycle}`);
            yield this.setPWM(channel, 0, Math.round(dutyCycle * 4095));
        });
    }
    setFrequency(freq) {
        return __awaiter(this, void 0, void 0, function* () {
            log(`Set PWM frequency to ${freq} Hz`);
            const prescale = Math.round(25000000 / (4096 * freq)) - 1;
            yield this.bus.writeByte(PCA9685.PCA9685_ADDRESS, PCA9685.MODE1, 0x10); // sleep
            yield this.bus.writeByte(PCA9685.PCA9685_ADDRESS, PCA9685.PRESCALE, prescale); // set frequency prescaler
            // Does it need to sleep?
            yield (0, utils_1.sleep)(1);
            yield this.bus.writeByte(PCA9685.PCA9685_ADDRESS, PCA9685.MODE1, 0x80); // wake up
            yield (0, utils_1.sleep)(1);
        });
    }
    setPWM(channel, on, off) {
        return __awaiter(this, void 0, void 0, function* () {
            log(`Set PWM for channel ${channel} to ${on} to ${off}`);
            yield Promise.all([
                this.bus.writeByte(PCA9685.PCA9685_ADDRESS, PCA9685.LED0_ON_L + 4 * channel, on & 0xff),
                this.bus.writeByte(PCA9685.PCA9685_ADDRESS, PCA9685.LED0_ON_H + 4 * channel, on >> 8),
                this.bus.writeByte(PCA9685.PCA9685_ADDRESS, PCA9685.LED0_OFF_L + 4 * channel, off & 0xff),
                this.bus.writeByte(PCA9685.PCA9685_ADDRESS, PCA9685.LED0_OFF_H + 4 * channel, off >> 8)
            ]);
        });
    }
}
exports.PCA9685 = PCA9685;
PCA9685.PCA9685_ADDRESS = 0x40;
PCA9685.MODE1 = 0x00;
PCA9685.PRESCALE = 0xfe;
PCA9685.LED0_ON_L = 0x06;
PCA9685.LED0_ON_H = 0x07;
PCA9685.LED0_OFF_L = 0x08;
PCA9685.LED0_OFF_H = 0x09;
