import { Module } from '../Module';
export declare class PCA9685 extends Module {
    static PCA9685_ADDRESS: number;
    static MODE1: number;
    static PRESCALE: number;
    static LED0_ON_L: number;
    static LED0_ON_H: number;
    static LED0_OFF_L: number;
    static LED0_OFF_H: number;
    init(): Promise<void>;
    setDutyCycle(channel: number, dutyCycle: number): Promise<void>;
    setFrequency(freq: number): Promise<void>;
    setPWM(channel: number, on: number, off: number): Promise<void>;
}
