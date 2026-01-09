import { z } from 'zod';
import { UserRole } from '../types';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email format'),
  roll_no: z.string().optional(),
  division: z.string().max(10).optional(),
  department: z.string().min(2, 'Department is required').max(100),
  role: z.nativeEnum(UserRole)
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const createEventSchema = z.object({
  name: z.string().min(2, 'Event name must be at least 2 characters').max(255),
  description: z.string().max(1000).optional(),
  department: z.string().min(2, 'Department is required').max(100),
  date: z.string().refine((date) => {
    const eventDate = new Date(date);
    const now = new Date();
    return eventDate > now;
  }, 'Event date must be in the future')
});

export const checkinSchema = z.object({
  qr_data: z.string().min(1, 'QR data is required')
});

export const studentsQuerySchema = z.object({
  division: z.string().max(10).optional(),
  department: z.string().max(100).optional()
});

// Middleware function to validate request body
export const validateBody = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: (error as any).errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// Middleware function to validate query parameters
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedQuery = schema.parse(req.query);
      // Merge validated query back to req.query
      Object.assign(req.query, validatedQuery);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: (error as any).errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};
