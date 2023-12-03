import * as i2c from 'i2c-bus';
import { sleep } from '../../utils';
import { debug } from '../../debug';

export const PCA9685_ADDRESS = 0x40;
export const MODE1 = 0x00;
export const PRESCALE = 0xfe;

const LED0_ON_L = 0x06;
const LED0_ON_H = 0x07;
const LED0_OFF_L = 0x08;
const LED0_OFF_H = 0x09;

const log = debug.extend('PCA9685');
export class PCA9685 {
    private bus: i2c.PromisifiedBus;
    private address: number;

    constructor(busNumber: number = 0, address: number = PCA9685_ADDRESS) {
        this.bus = i2c.openSync(busNumber).promisifiedBus();
        this.address = address;
    }

    async writeByte(register: number, value: number) {
        await this.bus.writeByte(this.address, register, value);
    }

    async readByte(register: number): Promise<number> {
        return await this.bus.readByte(this.address, register);
    }
    
    async setDutyCycle(channel: number, dutyCycle: number): Promise<void> {
        dutyCycle = Math.min(1, Math.max(0, dutyCycle)); // Clamp to [0,1]

        log(`Set duty cycle for channel ${channel} to ${dutyCycle}`)
        await this.setPWM(channel, 0, Math.round(dutyCycle * 4095));
    } 

    async setFrequency(freq: number) {
        log(`Set PWM frequency to ${freq} Hz`)

        const prescale = Math.round(25000000 / (4096 * freq)) - 1;

        await this.writeByte(MODE1, 0x10); // sleep
        await this.writeByte(PRESCALE, prescale); // set frequency prescaler
        // Does it need to sleep?
        await sleep(1);
        await this.writeByte(MODE1, 0x80); // wake up
        await sleep(1);
    }

    async setPWM(channel: number, on: number, off: number) {
        log(`Set PWM for channel ${channel} to ${on} to ${off}`)
        await Promise.all([
            this.bus.writeByte(this.address, LED0_ON_L + 4 * channel, on & 0xff),
            this.bus.writeByte(this.address, LED0_ON_H + 4 * channel, on >> 8),
            this.bus.writeByte(this.address, LED0_OFF_L + 4 * channel, off & 0xff),
            this.bus.writeByte(this.address, LED0_OFF_H + 4 * channel, off >> 8),
        ])
    }
}
