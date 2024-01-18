var mpu9250 = require('mpu9250');
// Instantiate and initialize.
var mpu = new mpu9250();
if (mpu.initialize()) {
  console.log(mpu.getMotion9());
}