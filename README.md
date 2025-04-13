# OpenI2C

**This library is highly experimental and is currently a work in progress.**

This library is a set of cross platform drivers for common I2C devices using i2c-bus.

## Prerequisites

-   Ensure that i2c is enabled on your device.

## Module Drivers

-   [PCA9685](src/modules/PCA9685) - A 16 channel pulse width modulation module.

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
mapValue(50, 0, 100, 0, 1); // Maps 50 in range 0 - 100 to range 0 - 1, result: 0.5
```

## Local Development

There's a good chance you are developing your software on a separate operating system from where it will finally run. In this case openi2c may not be compatible with your system. For example, developing on Windows or Mac for later deployment to Raspberry Pi running Raspbian. In these cases, you can install the library locally using `npm i --save openi2c --ignore-scripts` to prevent npm from running build when it installs. Since bindings will not exist, you will need to tell opengpio not to load the bindings when it imports the library. You can do this by setting the environment variable `OPENI2C_MOCKED=true`. This will prevent opengpio from loading the native bindings and instead all functions will be replaced with mock functions that don't call the native bindings.

If you have a case where you need to detect if the library is running with mocked bindings you can check a parameter called "mocked", exported from the library.

```ts
import openi2c from 'openi2c';
if (openi2c.mocked) {
    console.log('openi2c is running with mocked bindings');
}
```
