import * as i2c from 'i2c-bus';
import { sleep } from '../../utils';
import { debug } from '../../debug';
import { Module } from '../Module';

const log = debug.extend('PCA9685');
export class PCA9685 extends Module {
    static PCA9685_ADDRESS = 0x40;
    static MODE1 = 0x00;
    static PRESCALE = 0xfe;
    static LED0_ON_L = 0x06;
    static LED0_ON_H = 0x07;
    static LED0_OFF_L = 0x08;
    static LED0_OFF_H = 0x09;

    async init() {
        // TODO What configuration is needed?
        await this.setFrequency(50);
    }

    async setDutyCycle(channel: number, dutyCycle: number): Promise<void> {
        dutyCycle = Math.min(1, Math.max(0, dutyCycle)); // Clamp to [0,1]

        log(`Set duty cycle for channel ${channel} to ${dutyCycle}`);
        await this.setPWM(channel, 0, Math.round(dutyCycle * 4095));
    }

    async setFrequency(freq: number) {
        log(`Set PWM frequency to ${freq} Hz`);

        const prescale = Math.round(25000000 / (4096 * freq)) - 1;

        await this.bus.writeByte(PCA9685.PCA9685_ADDRESS, PCA9685.MODE1, 0x10); // sleep
        await this.bus.writeByte(PCA9685.PCA9685_ADDRESS, PCA9685.PRESCALE, prescale); // set frequency prescaler
        // Does it need to sleep?
        await sleep(1);
        await this.bus.writeByte(PCA9685.PCA9685_ADDRESS, PCA9685.MODE1, 0x80); // wake up
        await sleep(1);
    }

    async setPWM(channel: number, on: number, off: number) {
        log(`Set PWM for channel ${channel} to ${on} to ${off}`);
        await Promise.all([
            this.bus.writeByte(PCA9685.PCA9685_ADDRESS, PCA9685.LED0_ON_L + 4 * channel, on & 0xff),
            this.bus.writeByte(PCA9685.PCA9685_ADDRESS, PCA9685.LED0_ON_H + 4 * channel, on >> 8),
            this.bus.writeByte(PCA9685.PCA9685_ADDRESS, PCA9685.LED0_OFF_L + 4 * channel, off & 0xff),
            this.bus.writeByte(PCA9685.PCA9685_ADDRESS, PCA9685.LED0_OFF_H + 4 * channel, off >> 8)
        ]);
    }
}
