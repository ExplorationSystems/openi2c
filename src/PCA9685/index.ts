import * as i2c from 'i2c-bus';

export const PCA9685_ADDRESS = 0x40;
export const MODE1 = 0x00;
export const PRESCALE = 0xfe;
export const LED0_ON_L = 0x06;

export class PCA9685 {
    private bus: i2c.PromisifiedBus;
    private address: number;

    constructor(busNumber: number = 0, address: number = PCA9685_ADDRESS) {
        this.bus = i2c.openSync(busNumber).promisifiedBus();
        this.address = address;
    }

    async writeByte(register: number, value: number) {
        // await this.bus.i2cWrite(this.address, 1, Buffer.from([register, value]));
        await this.bus.writeByte(this.address, register, value);
    }

    async readByte(register: number): Promise<number> {
        return await this.bus.readByte(this.address, register);
    }
    
    async setDutyCycle(channel: number, dutyCycle: number): Promise<void> {
        await this.setPWM(channel, 0, Math.floor(dutyCycle * 4095));
    } 

    async setPWMFreq(freq: number) {
        console.log('setPWMFreq', freq)
        // let prescaleval = 25000000;
        // prescaleval /= 4096;
        // prescaleval /= freq;
        // prescaleval -= 1;
        // const prescale = Math.floor(prescaleval + 0.5);

        const prescale = Math.round(25000000 / (4096 * freq)) - 1;

        await this.writeByte(MODE1, 0x10); // sleep
        await this.writeByte(PRESCALE, prescale); // set frequency prescaler
        await sleep(50);
        await this.writeByte(MODE1, 0x80); // wake up
        await sleep(50);
        // console.log('setPWMFreq', await this.readByte(MODE1))
        // await this.writeByte(MODE1, 0x00); // wait for oscillator
    }

    async setPWM(channel: number, on: number, off: number) {
        console.log('setPWM', channel, on, off)
        // on -= 1;
        // off -= 1;

        const buffer = Buffer.from([LED0_ON_L + 4 * channel, on & 0xff, on >> 8, off & 0xff, off >> 8]);
        console.log(buffer)

        await this.bus.i2cWrite(
            this.address,
            5,
            buffer
        );
    }
}

function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}