import * as i2c from 'i2c-bus';
import { debug } from '../debug';

export abstract class Module<T extends Record<any, any>> {
    public readonly bus!: i2c.PromisifiedBus;
    public readonly config: T = {} as T;
    public readonly log!: debug.Debugger;
    public readonly address!: number;


    constructor(busNumber: number = 0, address: number, config?: Partial<T>) {
        this.config = Object.assign(this.config, config);
        this.address = address;
        this.bus = i2c.openSync(busNumber).promisifiedBus();
        this.log = debug.extend(`${this.constructor.name}`);
    }

    /**
     * Initialize the module.
     * Should be implemented by subclasses.
     */
    abstract init(): Promise<void>;

    async readByte(adrs: number){
       return await this.bus.readByte(this.address, adrs);
    }

    async readBytes(adrs: number, length: number){
        const buf = Buffer.alloc(length);
        await this.bus.readI2cBlock(this.address, adrs, length, buf);
        return buf;
    }

    async writeByte(adrs: number, value: number){
        await this.bus.writeByte(this.address, adrs, value);
     }

    async readBit(adrs: number, bit: number) {
        var buf = await this.readByte(adrs);
        return (buf >> bit) & 1;
    };

    bitMask(bit: number, length: number) {
        return ((1 << length) - 1) << bit;
    };
    
    /**
     * Write a sequence of bits.  Note, this will do a read to get the existing value, then a write.
     * @param  {number}   adrs     The address of the byte to write.
     * @param  {number}   bit      The nth bit to start at.
     * @param  {number}   length   The number of bits to change.
     * @param  {number}   value    The values to change.
     */
    async writeBits(adrs: number, bit: number, length: number, value: number) {
        const oldValue = await this.readByte(adrs);
        const mask = this.bitMask(bit, length);
        const newValue = oldValue ^ ((oldValue ^ (value << bit)) & mask);

        await this.writeByte(adrs, newValue);
    };

    /**
     * Write one bit.  Note, this will do a read to get the existing value, then a write.
     * @param  {number}   adrs     The address of the byte to write.
     * @param  {number}   bit      The nth bit.
     * @param  {number}   value    The new value, 1 or 0.
     */
    async writeBit(adrs: number, bit: number, value: number) {
        await this.writeBits(adrs, bit, 1, value);
    };
}
