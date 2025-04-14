import type { PromisifiedBus } from 'i2c-bus';
import { openBus } from '../bus';
import { debug } from '../debug';
import { AlreadyInitialisedError, NotInitialisedError } from '../errors';

export abstract class Module<T extends { address: number, [key: string]: any }> {
    public readonly bus!: PromisifiedBus;
    public readonly abstract config: T;

    constructor(busNumber: number = 0) {
        // Config will be set by the subclass, here we allow for partial config override
        this.bus = openBus(busNumber);
    }

    get address() {
        return this.config.address;
    }

    private _init: boolean = false;
    init() {
        this.debug('init called');

        if (this._init) {
            this.debug('Already initialised, throwing error');
            throw new AlreadyInitialisedError();
        }

        this._init = true;
    }

    assertInitialised() {
        if (!this._init) {
            this.debug('Not initialised, throwing error');
            throw new NotInitialisedError();
        }
    }

    private _debug: typeof debug | undefined = undefined;
    protected get debug() {
        if (!this._debug) {
            // This is done so that that name is the name of the class that extends Device.
            this._debug = debug.extend(this.constructor.name);
        }

        return this._debug;
    }


    async readInto(buf: Buffer, length: number) {
        this.assertInitialised();

        return await this.bus.i2cRead(this.address, length, buf);
    }

    async readByte(adrs: number) {
        this.assertInitialised();

        return await this.bus.readByte(this.address, adrs);
    }

    async readBytes(adrs: number, length: number) {
        this.assertInitialised();

        const buf = Buffer.alloc(length);
        await this.bus.readI2cBlock(this.address, adrs, length, buf);
        return buf;
    }

    async write(buf: Buffer) {
        this.assertInitialised();

        await this.bus.i2cWrite(this.address, buf.length, buf);
    }

    async writeByte(adrs: number, value: number) {
        this.assertInitialised();

        await this.bus.writeByte(this.address, adrs, value);
    }

    async writeBytes(adrs: number, buf: Buffer) {
        this.assertInitialised();

        await this.bus.writeI2cBlock(this.address, adrs, buf.length, buf);
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
