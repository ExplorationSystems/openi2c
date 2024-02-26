import { BNO08X, BNO_REPORT_ACCELEROMETER } from '.';

async function main() {
    const bno = new BNO08X();
    await bno.init();

    await bno.enableFeature(BNO_REPORT_ACCELEROMETER);
    await bno.enableFeature(BNO_REPORT_ACCELEROMETER);
    await bno.enableFeature(BNO_REPORT_ACCELEROMETER);
    await bno.enableFeature(BNO_REPORT_ACCELEROMETER);

    setInterval(async ()=>{
        const [accelX, accelY, accelZ] = await bno.acceleration();
        console.log(`X: ${accelX.toFixed(6)} Y: ${accelY.toFixed(6)} Z: ${accelZ.toFixed(6)} m/s^2`);
    }, 1000)
}
main();
