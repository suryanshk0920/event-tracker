import rateLimit from 'express-rate-limit';

// Check if we're in load testing mode
const isLoadTesting = process.env.NODE_ENV === 'load-testing' || process.env.ENABLE_LOAD_TESTING === 'true';

export const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS!) || 15 * 60 * 1000, // 15 minutes
  max: isLoadTesting ? 10000 : 5, // High limit for load testing, otherwise 5
  message: {
    error: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS!) || 15 * 60 * 1000, // 15 minutes
  max: isLoadTesting ? 10000 : 3, // High limit for load testing, otherwise 3
  message: {
    error: 'Too many registration attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const checkinLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isLoadTesting ? 1000 : 10, // High limit for load testing, otherwise 10
  message: {
    error: 'Too many checkin attempts, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS!) || 15 * 60 * 1000,
  max: isLoadTesting ? 50000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS!) || 100),
  message: {
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
