# OpenI2C
This library is a set of cross platform drivers for common I2C devices using i2c-bus.

## Prerequisites
- Ensure that i2c is enabled on your device.

## Module Drivers
- [PCA9685](src/modules/PCA9685) - A 16 channel pulse width modulation module.

## Using A Driver
You can import the driver by the module name, directly from the openi2c package.

For detailed usage of each driver, click on the module name in the section above.

```ts
import { PCA9685 } from 'openi2c';
const pwmDriver = new PCA9685();
await pwmDriver.setFrequency(50);
await pwmDriver.setDutyCycle(0, 0.5);
```

## Utilities
The library exports some utility functions that are used by internal drivers and can be useful for developers using these drivers.

```ts
import { sleep, mapValue } from 'openi2c';
await sleep(100); // Sleeps for 100ms
mapValue(50, 0, 100, 0, 1) // Maps 50 in range 0 - 100 to range 0 - 1, result: 0.5
```