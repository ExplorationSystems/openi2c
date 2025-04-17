import { INA219 } from '.';

async function main() {
    const ina219 = new INA219(1);
    await ina219.init();

    const current = await ina219.readCurrent();
    console.log(current.toString(16));
}
main();
