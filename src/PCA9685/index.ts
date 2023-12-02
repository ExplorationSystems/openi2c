import * as i2c from 'i2c-bus';

export const PCA9685_ADDRESS = 0x40;
export const MODE1 = 0x00;
export const PRESCALE = 0xfe;
// export const LED0_ON_L = 0x06;
const LED0_ON_L = 0x06;
const LED0_ON_H = 0x07;
const LED0_OFF_L = 0x08;
const LED0_OFF_H = 0x09;

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
        console.log(`Set duty cycle for channel ${channel} to ${dutyCycle}`)
        await this.setPWM(channel, 0, Math.round(dutyCycle * 4095));
    } 

    async setFrequency(freq: number) {
        console.log(`Set PWM frequency to ${freq} Hz`)

        const prescale = Math.round(25000000 / (4096 * freq)) - 1;

        await this.writeByte(MODE1, 0x10); // sleep
        await this.writeByte(PRESCALE, prescale); // set frequency prescaler
        // await sleep(50);
        await this.writeByte(MODE1, 0x80); // wake up
        // await sleep(50);
    }

    async setPWM(channel: number, on: number, off: number) {
        console.log(`Set PWM for channel ${channel} to ${on} to ${off}`)
        await Promise.all([
            this.bus.writeByte(this.address, LED0_ON_L + 4 * channel, on & 0xff),
            this.bus.writeByte(this.address, LED0_ON_H + 4 * channel, on >> 8),
            this.bus.writeByte(this.address, LED0_OFF_L + 4 * channel, off & 0xff),
            this.bus.writeByte(this.address, LED0_OFF_H + 4 * channel, off >> 8),
        ])
    }
}

function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}