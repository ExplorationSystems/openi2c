import * as i2c from 'i2c-bus';

export abstract class BaseDevice {
    bus!: i2c.PromisifiedBus;
    // private i2c: any; // Specify the correct type for i2c
    debug = console;
    address!: number;

    async readByte(adrs: number){
       return await this.bus.readByte(this.address, adrs);
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

    vectorToYesNo(v: number[]){
        var str = '(';
        str += v[0] ? 'No, ' : 'Yes, ';
        str += v[1] ? 'No, ' : 'Yes, ';
        str += v[2] ? 'No' : 'Yes';
        str += ')';
        return str;
    }

    /**
     * Write a sequence of bits.  Note, this will do a read to get the existing value, then a write.
     * @param  {number}   adrs     The address of the byte to write.
     * @param  {number}   bit      The nth bit to start at.
     * @param  {number}   length   The number of bits to change.
     * @param  {number}   value    The values to change.
     */
    async writeBits(adrs: number, bit: number, length: number, value: number) {
        const oldValue = await this.bus.readByte(this.address, adrs);
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

    abstract initialize(): Promise<any>;
}
