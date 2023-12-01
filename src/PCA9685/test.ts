import { PCA9685, MODE1 } from './index';
async function main() {
    const pwmDriver = new PCA9685();
    console.log('setPWMFreq', await pwmDriver.readByte(MODE1))
    // await pwmDriver.setPWMFreq(50);
    await pwmDriver.setPWM(0, 0, 2000); // Example usage
}

main();