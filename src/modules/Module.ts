import * as i2c from 'i2c-bus';
import { debug } from '../debug';

export abstract class Module<T extends Record<any, any>> {
    public readonly bus!: i2c.PromisifiedBus;
    public readonly config: T = {} as T;
    public readonly log!: debug.Debugger;

    constructor(busNumber: number = 0, config?: Partial<T>) {
        this.config = Object.assign(this.config, config);
        this.bus = i2c.openSync(busNumber).promisifiedBus();
        this.log = debug.extend(`${this.constructor.name}`);
    }

    /**
     * Initialize the module.
     * Should be implemented by subclasses.
     */
    abstract init(): Promise<void>;
}
