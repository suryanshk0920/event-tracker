"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalLimiter = exports.checkinLimiter = exports.registerLimiter = exports.loginLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Check if we're in load testing mode
const isLoadTesting = process.env.NODE_ENV === 'load-testing' || process.env.ENABLE_LOAD_TESTING === 'true';
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: isLoadTesting ? 10000 : 5, // High limit for load testing, otherwise 5
    message: {
        error: 'Too many login attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: isLoadTesting ? 10000 : 3, // High limit for load testing, otherwise 3
    message: {
        error: 'Too many registration attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.checkinLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: isLoadTesting ? 1000 : 10, // High limit for load testing, otherwise 10
    message: {
        error: 'Too many checkin attempts, please slow down'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: isLoadTesting ? 50000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100),
    message: {
        error: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
