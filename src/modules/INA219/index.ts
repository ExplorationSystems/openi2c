import { sleep, toSigned16Bit } from '../../utils';
import { Module } from '../Module';
import {
    BUS_VOLTAGE_REGISTER,
    CALIBRATION_REGISTER,
    CONFIGURATION_REGISTER,
    CURRENT_REGISTER,
    POWER_REGISTER,
    SHUNT_VOLTAGE_REGISTER
} from './constants'

export enum ShuntVoltagePGA {
    /**
     * TinyRange offers the range of +-40mV over the shunt resistor.
     * 
     * Conversly, TinyRange offers best resolution (~1.22μV). 
     */
    TinyRange = 0, // Gain = 1

    /**
     * SmallRange offers the range of +-80mV over the shunt resistor.
     * 
     * Conversly, SmallRange offers a bit worse resolution (~2.44μV).
     */
    SmallRange = 1, // Gain = 0.5
    
    /**
     * LargeRange offers the range of +-160mV over the shunt resistor.
     * 
     * Conversly, LargeRange offers worse resolution (~4.88μV).
     */
    LargeRange = 2, // Gain = 0.25
    
    /**
     * HugeRange offers the range of 320mV over the shunt resistor.
     * 
     * Conversly, HugeRange offers worst resolution (~9.766μV).
     */
    HugeRange = 3, // Gain = 0.125
}


export type Config = {
    address: number;

    // Configuration parameters

    /**
     * Set PGA gain.
     */
    shuntVoltagePGA: ShuntVoltagePGA;

    /**
     * Set this to `false` to set the low voltage full scale range of 16V.
     * Default is `true` or 32V range.
     */
    HighBusVoltageRange: boolean;

    // Calibration parameters

    /**
     * Maximum expected bus voltage.
     */
    maxBusVoltage: number;

    /**
     * Shunt resistor is 0.5ohm, but this lets you input the real value in case needed.
     */
    shuntResistance: number;

    /**
     * Shunt ADC resolution/averaging setting. See datasheet page 27. Four bits.
     */
    shuntADCResolution: number;

    /**
     * Bus ADC resolution/averaging setting. See datasheet page 26/27. Four bits.
     */
    busADCResolution: number;
}

export class INA219 extends Module<Config> {
    config: Config = {
        address: 0x40, // Default slave address with no soldering
        maxBusVoltage: 32,
        shuntResistance: 0.5,
        
        shuntVoltagePGA: ShuntVoltagePGA.HugeRange, // Default to smaller resolution to avoid overflow.
        HighBusVoltageRange: true,
        shuntADCResolution: 0x2, // Default is 12-bit mode
        busADCResolution: 2, // Default
    }

    private lsb?: number;

    constructor(busNumber?: number, config?: Partial<Config>) {
        super(busNumber);
        this.config = Object.assign(this.config, config);
    }

    async init() {
        super.init();

        // Init configuration register.
        // Read defaults
        let configReg = await this.bus.readWord(this.address, CONFIGURATION_REGISTER); 

        // PGA gain
        configReg = (configReg & 0xe7ff) | (this.config.shuntVoltagePGA << 11); // 0xe7ff masks PG1 and PG0
        configReg = (configReg & 0xdfff) | ((this.config.HighBusVoltageRange ? 1 : 0) << 13); // 0xdfff masks BRNG
        configReg = (configReg & 0xff87) | (this.config.shuntADCResolution << 3) // Masks SADC bits
        configReg = (configReg & 0xf87f) | (this.config.busADCResolution << 7) // Masks BADC bits

        // Finally write configReg
        await this.bus.writeWord(this.address, CONFIGURATION_REGISTER, configReg);

        await this.calibrate(
            this.config.maxBusVoltage,
            this.config.shuntResistance
        );
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
        shuntResistance: number,
    ) {
        // Calculate vShuntMax
        const vShuntMax = shuntResistance * (vBusMax / shuntResistance);

        // Calculate max possible current
        const maxPossibleI = vShuntMax / shuntResistance;

        // Calculate min and max LSB.
        const minimumLSB = maxPossibleI / 32767; // 2**15 - 1
        const maximumLSB = maxPossibleI / 4096;

        // Choose LSB from midpoint of min and max.
        const LSB = (minimumLSB + maximumLSB) / 2; // Adjust this for more granular or coarse resolution
        this.lsb = LSB;

        // Calculate calibration register value and write it to the register.
        const calibrationRegisterValue = Number.parseInt((0.04096 / (LSB * shuntResistance)).toFixed(0));
        console.log(calibrationRegisterValue)
        await this.bus.writeWord(this.address, CALIBRATION_REGISTER, calibrationRegisterValue);

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

    async readCurrent(): Promise<number> {
        this.assertInitialised();
        const current = toSigned16Bit(await this.bus.readWord(this.address, CURRENT_REGISTER));
        this.debug(`current register value: ${current}`);
        this.debug(`LSB: ${this.lsb!}`);
        const realCurrent = current * this.lsb!;

        this.debug(`shunt voltage: ${await this.getShuntVoltage()}`)

        return realCurrent
    }

    private async getShuntVoltage(): Promise<number> {
        const sVoltage = await this.bus.readWord(this.address, SHUNT_VOLTAGE_REGISTER);
        return toSigned16Bit(sVoltage);
    }
}