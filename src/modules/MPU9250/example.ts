import { mpu9250, MPU9250 } from './MPU9250';

async function main() {
    const mpu = new mpu9250({
        DEBUG:true,
        // scaleValues: true,
        UpMagneto: true,
        DLPF_CFG: MPU9250.DLPF_CFG_3600HZ,
        // Set Accel DLPF Value
        A_DLPF_CFG: MPU9250.A_DLPF_CFG_460HZ,
        SAMPLE_RATE: 8000,
    });
    await mpu.initialize();

    setInterval(async () => {
        const motion = await mpu.getMotion9();
        const roll = mpu.getRoll(motion);
        const pitch = mpu.getPitch(motion);
        console.log(roll, pitch);
    }, 1000);
}
main();
