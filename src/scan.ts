import { openBus } from './bus';

export async function scan(busNumber: number) {
    console.log(`Scanning I2C bus ${busNumber}...`)
    const bus = openBus(busNumber);
    const addresses = await bus.scan();
    console.log(addresses);
}