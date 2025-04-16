import { sleep } from '../../utils';
import { Module } from '../Module';
import {
    MODE1,
    PRESCALE,
    LED0_ON_L,
    LED0_ON_H,
    LED0_OFF_L,
    LED0_OFF_H,
} from './constants'

type Config = {
    address: number;
    frequency: number;
}

export class PCA9685 extends Module<Config> {
    config = {
        address: 0x40,
        frequency: 50,
    }

    constructor(busNumber?: number, config?: Partial<Config>) {
        super(busNumber);
        this.config = Object.assign(this.config, config);
    }

    async init() {
        super.init();

        await this.setFrequency(this.config.frequency);
    }

    async setDutyCycle(channel: number, dutyCycle: number): Promise<void> {
        dutyCycle = Math.min(1, Math.max(0, dutyCycle)); // Clamp to [0,1]

        this.debug(`Set duty cycle for channel ${channel} to ${dutyCycle}`);
        await this.setPWM(channel, 0, Math.round(dutyCycle * 4095));
    }

    async setFrequency(freq: number) {
        this.debug(`Set PWM frequency to ${freq} Hz`);

        const prescale = Math.round(25000000 / (4096 * freq)) - 1;

        await this.bus.writeByte(this.address, MODE1, 0x10); // sleep
        await this.bus.writeByte(this.address, PRESCALE, prescale); // set frequency prescaler
        // Does it need to sleep?
        await sleep(1);
        await this.bus.writeByte(this.address, MODE1, 0x80); // wake up
        await sleep(1);
    }

    async setPWM(channel: number, on: number, off: number) {
        this.debug(`Set PWM for channel ${channel} to ${on} to ${off}`);
        await Promise.all([
            this.bus.writeByte(this.address, LED0_ON_L + 4 * channel, on & 0xff),
            this.bus.writeByte(this.address, LED0_ON_H + 4 * channel, on >> 8),
            this.bus.writeByte(this.address, LED0_OFF_L + 4 * channel, off & 0xff),
            this.bus.writeByte(this.address, LED0_OFF_H + 4 * channel, off >> 8)
        ]);
    }
}