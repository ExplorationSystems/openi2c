import { Packet, PacketError, PacketHeader } from './Packet';
import * as i2c from 'i2c-bus';

async function main() {
    const bus = i2c.openSync(0).promisifiedBus();
    const buffer = Buffer.from([6, 0, 2, 0, 249, 0]);

    await bus.i2cWrite(0x4B, buffer.length, buffer);
    const readBuffer = Buffer.alloc(512);

    setInterval(async () => {
        const buf = await bus.i2cRead(0x4B, 276, readBuffer);
        console.log(buf);
    }, 1000);
}
main();