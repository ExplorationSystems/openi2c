import { openPromisified, PromisifiedBus } from 'i2c-bus';

const MODE1 = 0x00;
const PRESCALE = 0xfe;
const LED0_ON_L = 0x06;
const LED0_ON_H = 0x07;
const LED0_OFF_L = 0x08;
const LED0_OFF_H = 0x09;
const ALL_LED_ON_L = 0xfa;
const ALL_LED_ON_H = 0xfb;
const ALL_LED_OFF_L = 0xfc;
const ALL_LED_OFF_H = 0xfd;
const RESTART = 0x80;
const SLEEP = 0x10;
const ALLCALL = 0x01;
const INVRT = 0x10;
const OUTDRV = 0x04;

class PCA9685 {
    private device: PromisifiedBus;
    private address: number;
    private freq: number;

    constructor(address: number = 0x40, freq: number = 50) {
        this.address = address;
        this.freq = freq;
        this.device = openPromisified(1); // Adjust the bus number as per your hardware
    }

    async init(): Promise<void> {
        await this.writeByte(MODE1, 0x00); // Reset the device
        await this.setPWMFreq(this.freq);
    }

    private async writeByte(cmd: number, byte: number): Promise<void> {
        await this.device.writeByte(this.address, cmd, byte);
    }

    private async readByte(cmd: number): Promise<number> {
        return this.device.readByte(this.address, cmd);
    }

    async setPWMFreq(freq: number): Promise<void> {
        let prescaleVal = 25000000.0; // 25MHz
        prescaleVal /= 4096.0; // 12-bit
        prescaleVal /= freq;
        prescaleVal -= 1.0;
        const prescale = Math.floor(prescaleVal + 0.5);

        const oldmode = await this.readByte(MODE1);
        const newmode = (oldmode & 0x7f) | 0x10; // sleep
        await this.writeByte(MODE1, newmode); // go to sleep
        await this.writeByte(PRESCALE, prescale);
        await this.writeByte(MODE1, oldmode);
        await this.sleep(5);
        await this.writeByte(MODE1, oldmode | 0x80);
    }

    async setDutyCycle(channel: number, dutyCycle: number): Promise<void> {
        await this.setPWM(channel, 0, Math.floor(dutyCycle * 4095));
    }

    async setPWM(channel: number, on: number, off: number): Promise<void> {
        await this.writeByte(LED0_ON_L + 4 * channel, on & 0xff);
        await this.writeByte(LED0_ON_H + 4 * channel, on >> 8);
        await this.writeByte(LED0_OFF_L + 4 * channel, off & 0xff);
        await this.writeByte(LED0_OFF_H + 4 * channel, off >> 8);
    }

    async setAllPWM(on: number, off: number): Promise<void> {
        await this.writeByte(ALL_LED_ON_L, on & 0xff);
        await this.writeByte(ALL_LED_ON_H, on >> 8);
        await this.writeByte(ALL_LED_OFF_L, off & 0xff);
        await this.writeByte(ALL_LED_OFF_H, off >> 8);
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Additional methods for advanced control can be added here.
}

async function main() {
    const pwmDriver = new PCA9685();
    await pwmDriver.init();
    await pwmDriver.setPWM(0, 0, 4096); // Example usage
    // Other operations
}

main().catch(console.error);
