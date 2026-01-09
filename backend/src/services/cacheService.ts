import redis from '../config/redis';

const CACHE_TTL = 60; // 60 seconds

export const getCacheKey = (eventId: number, division?: string, department?: string): string => {
  let key = `event:${eventId}:students`;
  if (division) key += `:div:${division}`;
  if (department) key += `:dept:${department}`;
  return key;
};

export const cacheStudentList = async (
  eventId: number, 
  students: any[], 
  division?: string, 
  department?: string
): Promise<void> => {
  try {
    const key = getCacheKey(eventId, division, department);
    await redis.setEx(key, CACHE_TTL, JSON.stringify(students));
  } catch (error) {
    console.error('Error caching student list:', error);
    // Don't throw error, just log it - caching is not critical
  }
};

export const getCachedStudentList = async (
  eventId: number, 
  division?: string, 
  department?: string
): Promise<any[] | null> => {
  try {
    const key = getCacheKey(eventId, division, department);
    const cached = await redis.get(key);
    
    if (cached) {
      return JSON.parse(cached.toString());
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached student list:', error);
    return null;
  }
};

export const invalidateEventCache = async (eventId: number): Promise<void> => {
  try {
    // Get all keys that match the pattern for this event
    const pattern = `event:${eventId}:students*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error('Error invalidating event cache:', error);
  }
};

export const updateEventAttendance = async (eventId: number, userId: number): Promise<void> => {
  try {
    // Invalidate all cached student lists for this event
    await invalidateEventCache(eventId);
    
    // Optionally, you could also cache individual user attendance
    const attendanceKey = `attendance:${eventId}:${userId}`;
    await redis.setEx(attendanceKey, CACHE_TTL * 60, 'true'); // Cache for 1 hour
    
  } catch (error) {
    console.error('Error updating attendance cache:', error);
  }
};

export const isUserAttending = async (eventId: number, userId: number): Promise<boolean | null> => {
  try {
    const attendanceKey = `attendance:${eventId}:${userId}`;
    const cached = await redis.get(attendanceKey);
    
    if (cached === 'true') return true;
    if (cached === 'false') return false;
    
    return null; // Not cached
  } catch (error) {
    console.error('Error checking cached attendance:', error);
    return null;
  }
};