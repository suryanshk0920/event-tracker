"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const eventsController_1 = require("../controllers/eventsController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const validation_2 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const types_1 = require("../types");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Event management
router.post('/', auth_1.requireOrganizerOrAdmin, (0, validation_1.validateBody)(validation_2.createEventSchema), eventsController_1.createEvent);
router.get('/', eventsController_1.getEvents);
router.get('/:id', eventsController_1.getEventById);
// QR code management
router.get('/:id/qrcode', eventsController_1.getEventQRCode);
// Student checkin
router.post('/:id/checkin', rateLimiter_1.checkinLimiter, (0, validation_1.validateBody)(validation_2.checkinSchema), eventsController_1.checkinToEvent);
// Get students attending an event (with filtering)
router.get('/:id/students', (0, auth_1.requireRole)([types_1.UserRole.FACULTY, types_1.UserRole.ORGANIZER, types_1.UserRole.ADMIN]), (0, validation_1.validateQuery)(validation_2.studentsQuerySchema), eventsController_1.getEventStudents);
exports.default = router;
