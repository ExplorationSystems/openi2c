import { open as openI2CBus } from './bus';

export async function scan(busNumber: number) {
    console.log(`Scanning I2C bus ${busNumber}...`)
    const bus = openI2CBus(busNumber);
    const addresses = await bus.scan();
    console.log(addresses);
}