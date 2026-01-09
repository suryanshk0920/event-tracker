"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateBody = exports.studentsQuerySchema = exports.checkinSchema = exports.createEventSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(255),
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    roll_no: zod_1.z.string().optional(),
    division: zod_1.z.string().max(10).optional(),
    department: zod_1.z.string().min(2, 'Department is required').max(100),
    role: zod_1.z.nativeEnum(types_1.UserRole)
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required')
});
exports.createEventSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Event name must be at least 2 characters').max(255),
    description: zod_1.z.string().max(1000).optional(),
    department: zod_1.z.string().min(2, 'Department is required').max(100),
    date: zod_1.z.string().refine((date) => {
        const eventDate = new Date(date);
        const now = new Date();
        return eventDate > now;
    }, 'Event date must be in the future')
});
exports.checkinSchema = zod_1.z.object({
    qr_data: zod_1.z.string().min(1, 'QR data is required')
});
exports.studentsQuerySchema = zod_1.z.object({
    division: zod_1.z.string().max(10).optional(),
    department: zod_1.z.string().max(100).optional()
});
// Middleware function to validate request body
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    };
};
exports.validateBody = validateBody;
// Middleware function to validate query parameters
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            const validatedQuery = schema.parse(req.query);
            // Merge validated query back to req.query
            Object.assign(req.query, validatedQuery);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    error: 'Invalid query parameters',
                    details: error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    };
};
exports.validateQuery = validateQuery;
