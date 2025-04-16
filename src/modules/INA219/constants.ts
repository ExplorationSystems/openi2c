
/**
 * - All-register reset
 * - settings for bus voltage range
 * - PGA gain
 * - ADC resolution/averaging
 */
export const CONFIGURATION_REGISTER = 0x00;

/**
 * Shunt voltage measurement data.
 * 
 * *Read only*
 */
export const SHUNT_VOLTAGE_REGISTER = 0x01;

/**
 * Bus voltage
 * 
 * *Read only*
 */
export const BUS_VOLTAGE_REGISTER = 0x02;

/**
 * Power measurement data
 * 
 * Yields 0 value until `CALIBRATION_REGISTER` is programmed.
 * 
 * *Read only*
 */
export const POWER_REGISTER = 0x03;

/**
 * Current over the shunt resistor
 * 
 * Yields 0 value until `CALIBRATION_REGISTER` is programmed.
 * 
 * *Read only*
 */
export const CURRENT_REGISTER = 0x04;

/**
 * - Set full-scale range
 * - Set LSB of current and power measurements
 * - Overall system calibration
 * 
 * Current and power calibration are set by bits D15 to D1. D0 is not used in
 * the calculation.
 * 
 * This register sets the current that corresponds to a full-scale drop across
 * the shunt. Full-scale range and the LSB of the current and power
 * measurement depend on the value entered in this register.
 * 
 * **Defaults** to `0x00`, and it is not possible to write 1 to the LSB; It is
 * always 0.
 * 
 * See the datasheet for specifics.
 */
export const CALIBRATION_REGISTER = 0x05;