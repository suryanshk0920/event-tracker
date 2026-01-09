import express from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  deleteEvent,
  getEventQRCode,
  checkinToEvent,
  getEventStudents,
  attendanceStream
} from '../controllers/eventsController';
import {
  authenticateToken,
  requireOrganizerOrAdmin,
  requireFacultyOrAdmin,
  requireRole
} from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { createEventSchema, checkinSchema, studentsQuerySchema } from '../middleware/validation';
import { checkinLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Event management
router.post('/', requireOrganizerOrAdmin, validateBody(createEventSchema), createEvent);
router.get('/', getEvents);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.delete('/:id', requireOrganizerOrAdmin, deleteEvent);

// QR code management
router.get('/:id/qrcode', getEventQRCode);

// Student checkin
router.post('/:id/checkin', checkinLimiter, validateBody(checkinSchema), checkinToEvent);

// Get students attending an event (with filtering)
router.get('/:id/students', requireRole([UserRole.FACULTY, UserRole.ORGANIZER, UserRole.ADMIN]), validateQuery(studentsQuerySchema), getEventStudents);

// Real-time attendance stream (SSE)
router.get('/:id/attendance-stream', requireRole([UserRole.FACULTY, UserRole.ORGANIZER, UserRole.ADMIN]), attendanceStream);

export default router;