# Contributing
## New Drivers
1. To create a new driver, create a new folder under src with the module serial number as it is named (including case) by the manufacturer. Write your driver as a class and make use of the i2c-bus library.
2. Create an index.ts file in the root of the folder, this index file should export the driver class as the default export so developers can import the driver like: `import driver from 'openi2d/driver'`
3. Include a README.md file in the root. This should include information on how to use the driver, an example, and a link to the module datasheet.