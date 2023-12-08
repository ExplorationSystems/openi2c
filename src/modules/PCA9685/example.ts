import { PCA9685 } from '.';

async function main() {
    const pca9685 = new PCA9685(0, {
        frequency: 50
    });
    await pca9685.init();

    await pca9685.setDutyCycle(0, 0.5);
}
main();
