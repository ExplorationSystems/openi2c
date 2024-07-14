
export const BNO_CHANNEL_SHTP_COMMAND = 0;
export const BNO_CHANNEL_EXE = 1;
export const BNO_CHANNEL_CONTROL = 2;
export const BNO_CHANNEL_INPUT_SENSOR_REPORTS = 3;
export const BNO_CHANNEL_WAKE_INPUT_SENSOR_REPORTS = 4;
export const BNO_CHANNEL_GYRO_ROTATION_VECTOR = 5;
export const BNO_HEADER_LEN = 4;
// Calibrated Acceleration (m/s2)
export const BNO_REPORT_ACCELEROMETER = 0x01;
// Calibrated gyroscope (rad/s).
export const BNO_REPORT_GYROSCOPE = 0x02;
// Magnetic field calibrated (in µTesla). The fully calibrated magnetic field measurement.
export const BNO_REPORT_MAGNETOMETER = 0x03;
// Linear acceleration (m/s2). Acceleration of the device with gravity removed
export const BNO_REPORT_LINEAR_ACCELERATION = 0x04;
// Rotation Vector
export const BNO_REPORT_ROTATION_VECTOR = 0x05;
// Gravity Vector (m/s2). Vector direction of gravity
export const BNO_REPORT_GRAVITY = 0x06;
// Game Rotation Vector
export const BNO_REPORT_GAME_ROTATION_VECTOR = 0x08;
export const BNO_REPORT_GEOMAGNETIC_ROTATION_VECTOR = 0x09;
export const BNO_REPORT_STEP_COUNTER = 0x11;
export const BNO_REPORT_RAW_ACCELEROMETER = 0x14;
export const BNO_REPORT_RAW_GYROSCOPE = 0x15;
export const BNO_REPORT_RAW_MAGNETOMETER = 0x16;
export const BNO_REPORT_SHAKE_DETECTOR = 0x19;
export const BNO_REPORT_STABILITY_CLASSIFIER = 0x13;
export const BNO_REPORT_ACTIVITY_CLASSIFIER = 0x1E;
export const BNO_REPORT_GYRO_INTEGRATED_ROTATION_VECTOR = 0x2A; // TODO Should this be added to the list of available reports?

export const SHTP_REPORT_PRODUCT_ID_RESPONSE = 0xF8;
export const SHTP_REPORT_PRODUCT_ID_REQUEST = 0xF9;

export const GET_FEATURE_REQUEST = 0xFE;
export const SET_FEATURE_COMMAND = 0xFD;
export const GET_FEATURE_RESPONSE = 0xFC;
export const BASE_TIMESTAMP = 0xFB;
export const TIMESTAMP_REBASE = 0xFA;
export const COMMAND_REQUEST = 0xF2;
export const COMMAND_RESPONSE = 0xF1;

export const DEFAULT_REPORT_INTERVAL = 50000;  // in microseconds = 50ms
export const QUAT_READ_TIMEOUT = 500;  // timeout in ms
export const PACKET_READ_TIMEOUT = 2000;  // timeout in ms
export const FEATURE_ENABLE_TIMEOUT = 2000; // timeout in ms
export const DEFAULT_TIMEOUT = 2.0;
export const BNO08X_CMD_RESET = 0x01;
export const QUAT_Q_POINT = 14;

// DCD/ ME Calibration commands and sub-commands
export const SAVE_DCD = 0x6;
export const ME_CALIBRATE = 0x7;
export const ME_CAL_CONFIG = 0x00;
export const ME_GET_CAL = 0x01;

export const Q_POINT_14_SCALAR = 2 ** (14 * -1);
export const Q_POINT_12_SCALAR = 2 ** (12 * -1);
//export const Q_POINT_10_SCALAR = 2 ** (10 * -1)
export const Q_POINT_9_SCALAR = 2 ** (9 * -1);
export const Q_POINT_8_SCALAR = 2 ** (8 * -1);
export const Q_POINT_4_SCALAR = 2 ** (4 * -1);



// these raw reports require their counterpart to be enabled
export const RAW_REPORTS: Record<number, number> = {
    [BNO_REPORT_RAW_ACCELEROMETER]: BNO_REPORT_ACCELEROMETER,
    [BNO_REPORT_RAW_GYROSCOPE]: BNO_REPORT_GYROSCOPE,
    [BNO_REPORT_RAW_MAGNETOMETER]: BNO_REPORT_MAGNETOMETER,
}

export const AVAIL_SENSOR_REPORTS: Record<number, [number, number, number]> = {
    [BNO_REPORT_ACCELEROMETER]: [Q_POINT_8_SCALAR, 3, 10],
    [BNO_REPORT_GRAVITY]: [Q_POINT_8_SCALAR, 3, 10],
    [BNO_REPORT_GYROSCOPE]: [Q_POINT_9_SCALAR, 3, 10],
    [BNO_REPORT_MAGNETOMETER]: [Q_POINT_4_SCALAR, 3, 10],
    [BNO_REPORT_LINEAR_ACCELERATION]: [Q_POINT_8_SCALAR, 3, 10],
    [BNO_REPORT_ROTATION_VECTOR]: [Q_POINT_14_SCALAR, 4, 14],
    [BNO_REPORT_GEOMAGNETIC_ROTATION_VECTOR]: [Q_POINT_12_SCALAR, 4, 14],
    [BNO_REPORT_GAME_ROTATION_VECTOR]: [Q_POINT_14_SCALAR, 4, 12],
    [BNO_REPORT_STEP_COUNTER]: [1, 1, 12],
    [BNO_REPORT_SHAKE_DETECTOR]: [1, 1, 6],
    [BNO_REPORT_STABILITY_CLASSIFIER]: [1, 1, 6],
    [BNO_REPORT_ACTIVITY_CLASSIFIER]: [1, 1, 16],
    [BNO_REPORT_RAW_ACCELEROMETER]: [1, 3, 16],
    [BNO_REPORT_RAW_GYROSCOPE]: [1, 3, 16],
    [BNO_REPORT_RAW_MAGNETOMETER]: [1, 3, 16],
}

export const REPORT_LENGTHS: Record<number, number> = {
    [SHTP_REPORT_PRODUCT_ID_RESPONSE]: 16,
    // [SHTP_REPORT_PRODUCT_ID_REQUEST]: 16, // This wasn't here in the original code, but it seems like it should be because the origional duplicate SHTP_REPORT_PRODUCT_ID_RESPONSE, not sure if the value is correct.
    [GET_FEATURE_RESPONSE]: 17,
    [COMMAND_RESPONSE]: 16,
    [BASE_TIMESTAMP]: 5,
    [TIMESTAMP_REBASE]: 5,
}

export const INITIAL_REPORTS: Record<number, any> = {
    [BNO_REPORT_ACTIVITY_CLASSIFIER]: {
        "Tilting": -1,
        "most_likely": "Unknown",
        "OnStairs": -1,
        "On-Foot": -1,
        "Other": -1,
        "On-Bicycle": -1,
        "Still": -1,
        "Walking": -1,
        "Unknown": -1,
        "Running": -1,
        "In-Vehicle": -1,
    },
    [BNO_REPORT_STABILITY_CLASSIFIER]: "Unknown",
    [BNO_REPORT_ROTATION_VECTOR]: [0.0, 0.0, 0.0, 0.0],
    [BNO_REPORT_GAME_ROTATION_VECTOR]: [0.0, 0.0, 0.0, 0.0],
    [BNO_REPORT_GEOMAGNETIC_ROTATION_VECTOR]: [0.0, 0.0, 0.0, 0.0],
}

export const ENABLED_ACTIVITIES = 0x1FF; // All activities; 1 bit set for each of 8 activities, + Unknown