// import type { BytesRead, BytesWritten, I2CBus, I2CDeviceId, I2CFuncs, openPromisified, PromisifiedBus } from 'i2c-bus';

/**
 * This file is used to declare global types and interfaces for the i2c-bus library.
 * These are declared globally so that in bus.ts we can access the types before importing
 * the i2c-bus library so that we can create a mocked version of the library if requested
 * by the developer through the OPENI2C_MOCKED environment variable.
 */
// declare global {
//     type BytesRead = BytesRead;
//     type BytesWritten = BytesWritten;
//     interface I2CBus extends I2CBus { }
//     type I2CDeviceId = I2CDeviceId;
//     interface I2CFuncs extends I2CFuncs { }
//     type OpenBus = typeof openPromisified;
//     type PromisifiedBus = PromisifiedBus;
// }