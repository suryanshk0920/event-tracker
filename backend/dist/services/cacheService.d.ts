export declare const getCacheKey: (eventId: number, division?: string, department?: string) => string;
export declare const cacheStudentList: (eventId: number, students: any[], division?: string, department?: string) => Promise<void>;
export declare const getCachedStudentList: (eventId: number, division?: string, department?: string) => Promise<any[] | null>;
export declare const invalidateEventCache: (eventId: number) => Promise<void>;
export declare const updateEventAttendance: (eventId: number, userId: number) => Promise<void>;
export declare const isUserAttending: (eventId: number, userId: number) => Promise<boolean | null>;
