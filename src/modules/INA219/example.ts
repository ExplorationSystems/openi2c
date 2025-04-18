import { INA219, Config, ShuntVoltagePGA } from '.';
import { sleep } from '../../utils';

async function main() {

    const config: Config = {
        address: 0x40, // Default address
        maxBusVoltage: 5, // Application max voltage on bus
        shuntResistance: 0.5, // Default
        shuntVoltagePGA: ShuntVoltagePGA.HugeRange,
        busADCResolution: 2, // Default is 12-bit resolution single take, which takes about 500μs
        shuntADCResolution: 2,
        HighBusVoltageRange: false // false for 16v, true for 32v
    }

    const ina219 = new INA219(1);
    await ina219.init();

    while(true) {
        const current = await ina219.readCurrent();
        console.log(`${current.toString()}mA`);
        await sleep(300);
    }
}
main();
