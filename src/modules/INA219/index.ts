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

    async readCurrent(): Promise<number> {
        return this.bus.readWord(this.address, CURRENT_REGISTER);
    }

    /**
     * Calibrate
     * 
     * **Note**: Datasheet describes secondary, correctional calibration step. It is not implemented yet.
     * 
     * @param vBusMax Volts
     * @param vShuntMax Volts
     * @param shuntResistance Ohms
     */
    async calibrate(
        vBusMax: number,
        vShuntMax: number, 
        shuntResistance: number,
    ) {
        // Calculate max possible current
        const maxPossibleI = vShuntMax / shuntResistance;

        // Calculate min and max LSB.
        const minimumLSB = maxPossibleI / 32767; // 2**15 - 1
        const maximumLSB = maxPossibleI / 4096;

        // Choose LSB from midpoint of min and max.
        const LSB = (minimumLSB + maximumLSB) / 2; // Adjust this for more granular resolution

        // Calculate calibration register value and write it to the register.
        const calibrationRegisterValue = Number.parseInt((0.04096 / (LSB * shuntResistance)).toFixed(0));
        await this.bus.writeByte(this.address, CALIBRATION_REGISTER, calibrationRegisterValue);

        /*
        // Calculate power LSB
        const powerLSB = 20 * LSB;

        // Compute maximum current before overflow.
        const maxCurrent = LSB * 32767;
        let maxCurrentBeforeOverflow: number;
        if (maxPossibleI >= maxCurrent) {
            maxCurrentBeforeOverflow = maxPossibleI;
        } else {
            maxCurrentBeforeOverflow = maxCurrent;
        }

        // Compute maximum shunt voltage.
        const maxShuntVoltage = maxCurrentBeforeOverflow * shuntResistance;
        let maxShuntVoltageBeforeOverflow: number;
        if (maxShuntVoltage >= vShuntMax) {
            maxShuntVoltageBeforeOverflow = vShuntMax;
        } else {
            maxShuntVoltageBeforeOverflow = maxShuntVoltage;
        }

        // Calculate maximum power
        const maximumPower =  maxCurrentBeforeOverflow * vBusMax
        */
    }
}