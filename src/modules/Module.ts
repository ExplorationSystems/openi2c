import * as i2c from 'i2c-bus';

export abstract class Module {
    public readonly bus: i2c.PromisifiedBus;

    constructor(busNumber: number = 0) {
        this.bus = i2c.openSync(busNumber).promisifiedBus();
    }

    abstract init(): Promise<void>;
}
