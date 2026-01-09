import express from 'express';
import {
  getUsers,
  getUserById,
  getUserStats
} from '../controllers/usersController';
import { 
  authenticateToken, 
  requireFacultyOrAdmin,
  requireAdmin
} from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all users (faculty and admin only)
router.get('/', requireFacultyOrAdmin, getUsers);

// Get user statistics (admin only)
router.get('/stats', requireAdmin, getUserStats);

// Get user by ID (faculty and admin only)
router.get('/:id', requireFacultyOrAdmin, getUserById);

export default router;
