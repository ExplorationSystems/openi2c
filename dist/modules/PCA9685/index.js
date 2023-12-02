"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.PCA9685 = exports.PRESCALE = exports.MODE1 = exports.PCA9685_ADDRESS = void 0;
const i2c = __importStar(require("i2c-bus"));
const utils_1 = require("../../utils");
exports.PCA9685_ADDRESS = 0x40;
exports.MODE1 = 0x00;
exports.PRESCALE = 0xfe;
const LED0_ON_L = 0x06;
const LED0_ON_H = 0x07;
const LED0_OFF_L = 0x08;
const LED0_OFF_H = 0x09;
class PCA9685 {
    constructor(busNumber = 0, address = exports.PCA9685_ADDRESS) {
        this.bus = i2c.openSync(busNumber).promisifiedBus();
        this.address = address;
    }
    writeByte(register, value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.bus.writeByte(this.address, register, value);
        });
    }
    readByte(register) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.bus.readByte(this.address, register);
        });
    }
    setDutyCycle(channel, dutyCycle) {
        return __awaiter(this, void 0, void 0, function* () {
            dutyCycle = Math.min(1, Math.max(0, dutyCycle)); // Clamp to [0,1]
            console.log(`Set duty cycle for channel ${channel} to ${dutyCycle}`);
            yield this.setPWM(channel, 0, Math.round(dutyCycle * 4095));
        });
    }
    setFrequency(freq) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Set PWM frequency to ${freq} Hz`);
            const prescale = Math.round(25000000 / (4096 * freq)) - 1;
            yield this.writeByte(exports.MODE1, 0x10); // sleep
            yield this.writeByte(exports.PRESCALE, prescale); // set frequency prescaler
            // Does it need to sleep?
            yield (0, utils_1.sleep)(1);
            yield this.writeByte(exports.MODE1, 0x80); // wake up
            yield (0, utils_1.sleep)(1);
        });
    }
    setPWM(channel, on, off) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Set PWM for channel ${channel} to ${on} to ${off}`);
            yield Promise.all([
                this.bus.writeByte(this.address, LED0_ON_L + 4 * channel, on & 0xff),
                this.bus.writeByte(this.address, LED0_ON_H + 4 * channel, on >> 8),
                this.bus.writeByte(this.address, LED0_OFF_L + 4 * channel, off & 0xff),
                this.bus.writeByte(this.address, LED0_OFF_H + 4 * channel, off >> 8),
            ]);
        });
    }
}
exports.PCA9685 = PCA9685;
