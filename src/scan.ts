import * as i2c from 'i2c-bus';

const busNumber = +process.argv[2] || 0;
console.log(`Scanning I2C bus ${busNumber}...`)

i2c.openPromisified(busNumber).then(async (bus) => {
    bus.scan().then((addresses) => {
        console.log(addresses);
    });
});

// import { PCA9685 } from './index';

// async function main() {
//     const pwmDriver = new PCA9685();
//     await pwmDriver.setPWM(0, 0, 4096); // Example usage
// }
