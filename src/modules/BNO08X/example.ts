import { BNO08X } from '.';

async function main() {
    const pca9685 = new BNO08X();
    await pca9685.init();
    console.log('READY');
}
main();
