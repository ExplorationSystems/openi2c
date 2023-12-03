# Contributing
## New Drivers
- To create a new driver, create a new folder under src/modules with the module serial number (eg. PCA9685) as it is named (including case) by the manufacturer. Write your driver as a class and make use of the i2c-bus library. 
- Create an index.ts file in the root of the folder, this index file should export the driver class directly, not as defaut, so developers can import the driver using `import { driver } from 'openi2c'`.
- Include a README.md file in the root. This should include information on how to use the driver, an example, and a link to the module datasheet.
- Include an example.ts file where you show example usage of the module.
- When adding debug logs, use the debug function exported from debug.ts and extend it to create a correctly namespaced logger with the name of the module.
```ts
import { debug } from '../../debug';
const log = debug.extend('PCA9685');
log('hello world')
// Logs: "openi2c:PCA9685 hello world"
```

### Structure
Your driver should be a class that is named the same as the manufacturer name for the module. The class should make use of i2c-bus promisifed bus to prevent blocking operations.