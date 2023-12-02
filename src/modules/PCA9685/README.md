# PCA2685
Datasheet: https://cdn-shop.adafruit.com/datasheets/PCA9685.pdf


## Usage
```ts
import { PCA9685 } from 'openi2c/PCA9685';

// Inside an async function...
const pwmDriver = new PCA9685();
await pwmDriver.setFrequency(50);
await pwmDriver.setDutyCycle(0, 0.5);
```

The `setDutyCycle(channel:number, dutyCycle:number)` method wraps over the `setPWM(channel:number, on:number, off:number)` method, allowing you to provide a 0-1 value to represent the duty cycle percentage. If you want more complex usage, you can use `setPWM` directly, which would give you the ability to set the on point and off point directly. You can read the data sheet for the module to get further information on this.