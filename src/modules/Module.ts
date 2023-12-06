import * as i2c from 'i2c-bus';
import { randomBytes } from 'crypto';
import { debug } from '../debug';

export abstract class Module<T extends Record<any, any>> {
    public readonly bus: i2c.PromisifiedBus;
    public readonly config: T = {} as T;
    private readyPromise: Promise<void> | undefined;
    public readonly log: debug.Debugger;
    public readonly id = randomBytes(4).toString('hex');

    constructor(busNumber: number = 0, config?: Partial<T>) {
        this.config = Object.assign(this.config, config);
        this.bus = i2c.openSync(busNumber).promisifiedBus();
        this.log = debug.extend(`${this.constructor.name}_${this.id}`);
    }

    get ready(): Promise<void> {
        if (!this.readyPromise) {
            this.readyPromise = this.init();
        }
        return this.readyPromise;
    }

    /**
     * Initialize the module.
     * Should be implemented by subclasses.
     */
    async init() { }
}
