import * as i2c from 'i2c-bus';
export declare abstract class Module {
    readonly bus: i2c.PromisifiedBus;
    constructor(busNumber?: number);
    abstract init(): Promise<void>;
}
