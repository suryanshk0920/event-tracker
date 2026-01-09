import express from 'express';
import { register, login, getProfile, changePassword } from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { registerSchema, loginSchema } from '../middleware/validation';
import { registerLimiter, loginLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Public routes
router.post('/login', loginLimiter, validateBody(loginSchema), login);

// Admin-only route for registration
router.post('/register', registerLimiter, authenticateToken, requireAdmin, validateBody(registerSchema), register);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.post('/change-password', authenticateToken, changePassword);

export default router;