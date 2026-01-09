"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserAttending = exports.updateEventAttendance = exports.invalidateEventCache = exports.getCachedStudentList = exports.cacheStudentList = exports.getCacheKey = void 0;
const redis_1 = __importDefault(require("../config/redis"));
const CACHE_TTL = 60; // 60 seconds
const getCacheKey = (eventId, division, department) => {
    let key = `event:${eventId}:students`;
    if (division)
        key += `:div:${division}`;
    if (department)
        key += `:dept:${department}`;
    return key;
};
exports.getCacheKey = getCacheKey;
const cacheStudentList = async (eventId, students, division, department) => {
    try {
        const key = (0, exports.getCacheKey)(eventId, division, department);
        await redis_1.default.setEx(key, CACHE_TTL, JSON.stringify(students));
    }
    catch (error) {
        console.error('Error caching student list:', error);
        // Don't throw error, just log it - caching is not critical
    }
};
exports.cacheStudentList = cacheStudentList;
const getCachedStudentList = async (eventId, division, department) => {
    try {
        const key = (0, exports.getCacheKey)(eventId, division, department);
        const cached = await redis_1.default.get(key);
        if (cached) {
            return JSON.parse(cached.toString());
        }
        return null;
    }
    catch (error) {
        console.error('Error getting cached student list:', error);
        return null;
    }
};
exports.getCachedStudentList = getCachedStudentList;
const invalidateEventCache = async (eventId) => {
    try {
        // Get all keys that match the pattern for this event
        const pattern = `event:${eventId}:students*`;
        const keys = await redis_1.default.keys(pattern);
        if (keys.length > 0) {
            await redis_1.default.del(keys);
        }
    }
    catch (error) {
        console.error('Error invalidating event cache:', error);
    }
};
exports.invalidateEventCache = invalidateEventCache;
const updateEventAttendance = async (eventId, userId) => {
    try {
        // Invalidate all cached student lists for this event
        await (0, exports.invalidateEventCache)(eventId);
        // Optionally, you could also cache individual user attendance
        const attendanceKey = `attendance:${eventId}:${userId}`;
        await redis_1.default.setEx(attendanceKey, CACHE_TTL * 60, 'true'); // Cache for 1 hour
    }
    catch (error) {
        console.error('Error updating attendance cache:', error);
    }
};
exports.updateEventAttendance = updateEventAttendance;
const isUserAttending = async (eventId, userId) => {
    try {
        const attendanceKey = `attendance:${eventId}:${userId}`;
        const cached = await redis_1.default.get(attendanceKey);
        if (cached === 'true')
            return true;
        if (cached === 'false')
            return false;
        return null; // Not cached
    }
    catch (error) {
        console.error('Error checking cached attendance:', error);
        return null;
    }
};
exports.isUserAttending = isUserAttending;
