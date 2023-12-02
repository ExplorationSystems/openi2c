import * as i2c from 'i2c-bus';


export async function scan(busNumber:number) {
    // const busNumber = +process.argv[2] || 0;
    console.log(`Scanning I2C bus ${busNumber}...`)

    const bus = await i2c.openPromisified(busNumber);
    const addresses = await bus.scan();
    console.log(addresses);
}