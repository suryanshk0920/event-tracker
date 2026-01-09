import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redis = createClient({
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
  } catch (error) {
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

export default redis;