import * as i2c from 'i2c-bus';
import { sleep } from '../../utils';
import { debug } from '../../debug';
import { Module } from '../Module';

export const config = {
    // Module Registers
    ADDRESS: 0x40,
    MODE1: 0x00,
    PRESCALE: 0xfe,
    LED0_ON_L: 0x06,
    LED0_ON_H: 0x07,
    LED0_OFF_L: 0x08,
    LED0_OFF_H: 0x09,

    // Library Defaults
    frequency: 50
}

export class PCA9685 extends Module<typeof config> {
    public readonly config = config;
    async init() {
        await this.setFrequency(this.config.frequency);
    }

    async setDutyCycle(channel: number, dutyCycle: number): Promise<void> {
        dutyCycle = Math.min(1, Math.max(0, dutyCycle)); // Clamp to [0,1]

        this.log(`Set duty cycle for channel ${channel} to ${dutyCycle}`);
        await this.setPWM(channel, 0, Math.round(dutyCycle * 4095));
    }

    async setFrequency(freq: number) {
        this.log(`Set PWM frequency to ${freq} Hz`);

        const prescale = Math.round(25000000 / (4096 * freq)) - 1;

        await this.bus.writeByte(this.config.ADDRESS, this.config.MODE1, 0x10); // sleep
        await this.bus.writeByte(this.config.ADDRESS, this.config.PRESCALE, prescale); // set frequency prescaler
        // Does it need to sleep?
        await sleep(1);
        await this.bus.writeByte(this.config.ADDRESS, this.config.MODE1, 0x80); // wake up
        await sleep(1);
    }

    async setPWM(channel: number, on: number, off: number) {
        this.log(`Set PWM for channel ${channel} to ${on} to ${off}`);
        await Promise.all([
            this.bus.writeByte(this.config.ADDRESS, this.config.LED0_ON_L + 4 * channel, on & 0xff),
            this.bus.writeByte(this.config.ADDRESS, this.config.LED0_ON_H + 4 * channel, on >> 8),
            this.bus.writeByte(this.config.ADDRESS, this.config.LED0_OFF_L + 4 * channel, off & 0xff),
            this.bus.writeByte(this.config.ADDRESS, this.config.LED0_OFF_H + 4 * channel, off >> 8)
        ]);
    }
}
