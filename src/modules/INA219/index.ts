import { sleep } from '../../utils';
import { Module } from '../Module';
import {
    BUS_VOLTAGE_REGISTER,
    CALIBRATION_REGISTER,
    CONFIGURATION_REGISTER,
    CURRENT_REGISTER,
    POWER_REGISTER,
    SHUNT_VOLTAGE_REGISTER
} from './constants'

type Config = {
    address: number;

    // `true` will swap sent/received byte order
    // INA219 expects all instructions in big-endian order.
    littleEndianMaster: boolean;

    // Calibration parameters
    maxBusVoltage: number;
    maxShuntVoltage: number;
    shuntResistance: number;
}

export class INA219 extends Module<Config> {
    config: Config = {
        address: 0x81, // Slave address, when A1=GND and A0=Vs+
        littleEndianMaster: true,
        maxBusVoltage: 32,
        maxShuntVoltage: 0.32,
        shuntResistance: 0.5,
    }

    constructor(busNumber?: number, config?: Partial<Config>) {
        super(busNumber);
        this.config = Object.assign(this.config, config);
    }

    async init() {
        super.init();

        await this.calibrate(
            this.config.maxBusVoltage,
            this.config.maxShuntVoltage,
            this.config.shuntResistance
        );
    }

    /**
     * Calibrate 
     * @param maxBusVoltage Amperes
     * @param maxShuntVoltage Volts
     * @param shuntResistance Ohms
     */
    async calibrate(
        maxBusVoltage: number,
        maxShuntVoltage: number, 
        shuntResistance: number,
    ) {
        const maxCurrent = maxShuntVoltage / shuntResistance;
        const analogToDigitalStep = maxCurrent / 32767; // 2**15 - 1
        const coarseAnalogToDigitalStep = maxCurrent / 4096;
        const mediumAnalogToDigitalStep = (analogToDigitalStep + coarseAnalogToDigitalStep) / 2; // Adjust this for more granular resolution

        const calibrationValue = Number.parseInt((0.04096 / (mediumAnalogToDigitalStep * shuntResistance)).toFixed(0));

        this.bus.writeByte(this.address, CONFIGURATION_REGISTER, calibrationValue);
    }
}