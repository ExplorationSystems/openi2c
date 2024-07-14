import debug from 'debug';

const log = debug('openi2c');
log.log = console.log.bind(console);
export { log as debug };