export declare const PCA9685_ADDRESS = 64;
export declare const MODE1 = 0;
export declare const PRESCALE = 254;
export declare class PCA9685 {
    private bus;
    private address;
    constructor(busNumber?: number, address?: number);
    writeByte(register: number, value: number): Promise<void>;
    readByte(register: number): Promise<number>;
    setDutyCycle(channel: number, dutyCycle: number): Promise<void>;
    setFrequency(freq: number): Promise<void>;
    setPWM(channel: number, on: number, off: number): Promise<void>;
}
