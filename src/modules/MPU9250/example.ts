import { MPU9250 } from '.';

async function main() {
    const mpu9250 = new MPU9250();
    await mpu9250.init();

    while (true) {
        const { x, y, z } = await mpu9250.readAccelerometer();
        console.log(`x: ${x}, y: ${y}, z: ${z}`);
    }
}
main();
