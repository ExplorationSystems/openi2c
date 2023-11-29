import * as i2c from 'i2c-bus';

const PCA9685_ADDRESS = 0x40;
const MODE1 = 0x00;
const PRESCALE = 0xFE;
const LED0_ON_L = 0x06;

class PCA9685 {
  private bus: i2c.PromisifiedBus;
  private address: number;

  constructor(busNumber: number, address: number = PCA9685_ADDRESS) {
    this.bus = i2c.openSync(busNumber);
    this.address = address;
  }

  private async writeByte(register: number, value: number) {
    await this.bus.i2cWrite(this.address, 1, Buffer.from([register, value]));
  }

  async setPWMFreq(freq: number) {
    let prescaleval = 25000000;
    prescaleval /= 4096;
    prescaleval /= freq;
    prescaleval -= 1;
    const prescale = Math.floor(prescaleval + 0.5);

    await this.writeByte(MODE1, 0x10); // sleep
    await this.writeByte(PRESCALE, prescale); // set frequency prescaler
    await this.writeByte(MODE1, 0x80); // wake up
  }

  async setPWM(channel: number, on: number, off: number) {
    await this.bus.i2cWrite(this.address, 4, Buffer.from([LED0_ON_L + 4 * channel, on & 0xFF, on >> 8, off & 0xFF, off >> 8]));
  }
}