import { INA219, Config } from '.';
import { sleep } from '../../utils';

async function main() {

    const config: Config = {
        address: 0x40, // Default address
        littleEndianMaster: true,  // Currently unused
        maxBusVoltage: 32, // Default
        shuntResistance: 0.5, // Default
    }

    const ina219 = new INA219(1, config);
    await ina219.init();

    while(true) {
        const current = await ina219.readCurrent();
        console.log(`${current.toString()}mA`);
        await sleep(300);
    }
}
main();
