export class NotInitialisedError extends Error {
    message = 'The module has not been initialised, call init() first.';
}