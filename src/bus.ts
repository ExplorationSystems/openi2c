/**
 * Only import i2c-bus types here so that we can mock the library if needed.
 * On certin operating systems this library is not available and we need to 
 * mock it. We want access to the types without importing the library because
 * it would otherwise throw an error unsupported systems where a developer
 * mihght be using the library.
 */
import type { BytesRead, BytesWritten, I2CBus, I2CDeviceId, I2CFuncs, OpenOptions, openSync, PromisifiedBus } from 'i2c-bus';
import { debug as debugLogger } from './debug';

type OpenBus = (busNumber: number, options?: OpenOptions) => PromisifiedBus;

const debug = debugLogger.extend('i2c-bus');
const mocked = process.env.OPENI2C_MOCKED === 'true';

let openBus: OpenBus;
if (!mocked) {
    debug('Loading i2c bus...');
    openBus = (busNumber, options) => {
        debug('Open i2c bus...');
        // Open the bus synchronously and return the promisified bus
        return require('i2c-bus').openSync(busNumber, options).promisifiedBus();
    }
} else {
    // Mocked bindings
    debug('Using mocked i2c bus...');
    openBus = () => {
        const bus: PromisifiedBus = {
            close: async () => {
                debug('Mock: close() called');
            },
            i2cFuncs: async () => {
                debug('Mock: i2cFuncs() called');
                const i2cFuncs: I2CFuncs = {
                    i2c: true,
                    tenBitAddr: false,
                    protocolMangling: false,
                    smbusPec: false,
                    smbusBlockProcCall: false,
                    smbusQuick: false,
                    smbusReceiveByte: true,
                    smbusSendByte: true,
                    smbusReadByte: true,
                    smbusWriteByte: true,
                    smbusReadWord: true,
                    smbusWriteWord: true,
                    smbusProcCall: false,
                    smbusReadBlock: true,
                    smbusWriteBlock: true,
                    smbusReadI2cBlock: true,
                    smbusWriteI2cBlock: true,
                };

                return i2cFuncs;
            },
            scan: async (...args: any[]) => {
                debug(`Mock: scan(${args.join(', ')}) called`);
                return [0x10, 0x20, 0x30]; // Mocked device addresses
            },
            deviceId: async (...args: any) => {
                debug(`Mock: deviceId(${args}) called`);
                return {
                    manufacturer: 1234,
                    product: 5678,
                    name: 'Mocked Device',
                };
            },
            i2cRead: async (address, length, buffer) => {
                debug(`Mock: i2cRead(${address}, ${length}) called`);
                buffer.fill(0x42, 0, length); // Mocked data
                return { bytesRead: length, buffer };
            },
            i2cWrite: async (address, length, buffer) => {
                debug(`Mock: i2cWrite(${address}, ${length}) called`);
                return { bytesWritten: length, buffer };
            },
            readByte: async (...args: any[]): Promise<number> => {
                debug(`Mock: readByte(${args.join(', ')}) called`);
                return 0x42; // Mocked byte
            },
            readWord: async (...args: any[]): Promise<number> => {
                debug(`Mock: readWord(${args.join(', ')}) called`);
                return 0x4242; // Mocked word
            },
            readI2cBlock: async (address, command, length, buffer): Promise<BytesRead> => {
                debug(`Mock: readI2cBlock(${address}, ${command}, ${length}) called`);
                buffer.fill(0x42, 0, length); // Mocked data
                return { bytesRead: length, buffer };
            },
            writeByte: async (...args: any[]): Promise<void> => {
                debug(`Mock: writeByte(${args.join(', ')}) called`);
            },
            writeWord: async (...args: any[]): Promise<void> => {
                debug(`Mock: writeWord(${args.join(', ')}) called`);
            },
            writeI2cBlock: async (address, command, length, buffer): Promise<BytesWritten> => {
                debug(`Mock: writeI2cBlock(${address}, ${command}, ${length}) called`);
                return { bytesWritten: length, buffer };
            },
            receiveByte: async (...args: any[]): Promise<number> => {
                debug(`Mock: receiveByte(${args.join(', ')}) called`);
                return 0x42; // Mocked byte
            },
            sendByte: async (...args: any[]): Promise<void> => {
                debug(`Mock: sendByte(${args.join(', ')}) called`);
            },
            writeQuick: async (...args: any[]): Promise<void> => {
                debug(`Mock: writeQuick(${args.join(', ')}) called`);
            },
            bus: () => {
                debug('Mock: bus() called');
                return {} as I2CBus; // Mocked bus instance
            },
        };

        return bus;
    }
}


export { openBus, mocked }