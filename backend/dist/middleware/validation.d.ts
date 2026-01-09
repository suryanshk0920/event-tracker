import { z } from 'zod';
import { UserRole } from '../types';
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    roll_no: z.ZodOptional<z.ZodString>;
    division: z.ZodOptional<z.ZodString>;
    department: z.ZodString;
    role: z.ZodEnum<typeof UserRole>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const createEventSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    department: z.ZodString;
    date: z.ZodString;
}, z.core.$strip>;
export declare const checkinSchema: z.ZodObject<{
    qr_data: z.ZodString;
}, z.core.$strip>;
export declare const studentsQuerySchema: z.ZodObject<{
    division: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const validateBody: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
export declare const validateQuery: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
