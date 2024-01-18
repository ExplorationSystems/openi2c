# MPU9250

Product Specification: https://invensense.tdk.com/wp-content/uploads/2015/02/PS-MPU-9250A-01-v1.1.pdf
Register Map: https://cdn.sparkfun.com/assets/learn_tutorials/5/5/0/MPU-9250-Register-Map.pdf
AK8963C documentation: https://www.akm.com/akm/en/file/datasheet/AK8963C.pdf

Adapted from:
https://github.com/miniben-90/mpu9250
https://github.com/jstapels/mpu6050

This might have hte MPU-9255 inside:
https://stanford.edu/class/ee267/misc/MPU-9255-Datasheet.pdf

## Usage

```ts
import { PCA9685 } from 'openi2c/PCA9685';

// Inside an async function...
const pwmDriver = new PCA9685();
await pwmDriver.setFrequency(50);
await pwmDriver.setDutyCycle(0, 0.5);
```

The `setDutyCycle(channel:number, dutyCycle:number)` method wraps over the `setPWM(channel:number, on:number, off:number)` method, allowing you to provide a 0-1 value to represent the duty cycle percentage. If you want more complex usage, you can use `setPWM` directly, which would give you the ability to set the on point and off point directly. You can read the data sheet for the module to get further information on this.
