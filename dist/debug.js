"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = void 0;
const debug_1 = __importDefault(require("debug"));
const log = (0, debug_1.default)('openi2c');
exports.debug = log;
