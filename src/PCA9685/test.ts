import * as i2c from 'i2c-bus';

i2c.openPromisified(0).then(async (bus) => {
    console.log(bus);
    // bus.scan().then((addresses) => {
    //     console.log(addresses);
    // });
});

// import { PCA9685 } from './index';

// async function main() {
//     const pwmDriver = new PCA9685();
//     await pwmDriver.setPWM(0, 0, 4096); // Example usage
// }
