import * as i2c from 'i2c-bus';
import { sleep } from '../../utils';
import { debug } from '../../debug';
import { Module } from '../Module';

export const defaultConfig = {
    // Module Registers
    ADDRESS: 0x4B,
    
}
type Config = typeof config;

export class BNO08X extends Module<Config> {
    private readonly DATA_BUFFER_SIZE = 512;

    constructor(busNumber: number = 0, address: number = defaultConfig.ADDRESS, config?: Partial<Config>, ) {
        super(busNumber, address, config);
        
        // self._debug: bool = debug
        // self._reset: Optional[DigitalInOut] = reset
        // self._dbg("********** __init__ *************")
        self.dataBuffer: Buffer = Buffer.alloc(this.DATA_BUFFER_SIZE)
        self._command_buffer: bytearray = bytearray(12)
        self._packet_slices: List[Any] = []

        # TODO: this is wrong there should be one per channel per direction
        self._sequence_number: List[int] = [0, 0, 0, 0, 0, 0]
        self._two_ended_sequence_numbers: Dict[int, int] = {}
        self._dcd_saved_at: float = -1
        self._me_calibration_started_at: float = -1.0
        self._calibration_complete = False
        self._magnetometer_accuracy = 0
        self._wait_for_initialize = True
        self._init_complete = False
        self._id_read = False
        # for saving the most recent reading when decoding several packets
        self._readings: Dict[int, Any] = {}
        self.initialize()
    }

    async init() {
        // Hard reset? 
    }

}

export const config = defaultConfig;