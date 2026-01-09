"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redis = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});
redis.on('connect', () => {
    console.log('Connected to Redis');
});
// Connect to Redis
(async () => {
    try {
        await redis.connect();
    }
    catch (error) {
        console.warn('Redis not available, running without cache:', error.message);
        // Create a mock Redis client for development
        const mockRedis = {
            setEx: () => Promise.resolve(),
            get: () => Promise.resolve(null),
            del: () => Promise.resolve(),
            keys: () => Promise.resolve([])
        };
        Object.assign(redis, mockRedis);
    }
})();
exports.default = redis;
