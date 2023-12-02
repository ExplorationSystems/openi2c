import { PCA9685 } from './index';
async function main() {
    const pwmDriver = new PCA9685();
    await pwmDriver.setFrequency(50);

    let dutyCycle = 0;
    setInterval(async () => {
        await pwmDriver.setDutyCycle(0, dutyCycle); 
        dutyCycle += 0.1;
        if (dutyCycle > 1) dutyCycle = 0;
    },500)
}

main();