"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventById = exports.getEventStudents = exports.checkinToEvent = exports.getEventQRCode = exports.getEvents = exports.createEvent = void 0;
const database_1 = __importDefault(require("../config/database"));
const types_1 = require("../types");
const qrService_1 = require("../services/qrService");
const cacheService_1 = require("../services/cacheService");
const createEvent = async (req, res) => {
    try {
        const { name, description, department, date } = req.body;
        const organizerId = req.user.id;
        // Insert event
        const result = await database_1.default.query(`
      INSERT INTO events (name, description, department, date, organizer_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, department, date, organizer_id, created_at
    `, [name, description || null, department, new Date(date), organizerId]);
        const event = result.rows[0];
        // Generate QR code for the event
        const qrCode = await (0, qrService_1.generateQRCodeForEvent)(event.id);
        // Update event with QR code
        await database_1.default.query('UPDATE events SET qr_code = $1 WHERE id = $2', [qrCode, event.id]);
        res.status(201).json({
            message: 'Event created successfully',
            event: {
                ...event,
                qr_code: qrCode
            }
        });
    }
    catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createEvent = createEvent;
const getEvents = async (req, res) => {
    try {
        const userRole = req.user.role;
        const userId = req.user.id;
        let query = '';
        let params = [];
        if (userRole === types_1.UserRole.STUDENT) {
            // Students see all events with attendance status
            query = `
        SELECT e.id, e.name, e.description, e.department, e.date, e.created_at,
               u.name as organizer_name,
               CASE WHEN ea.user_id IS NOT NULL THEN true ELSE false END as is_attending
        FROM events e
        JOIN users u ON e.organizer_id = u.id
        LEFT JOIN event_attendance ea ON e.id = ea.event_id AND ea.user_id = $1
        ORDER BY e.date DESC
      `;
            params = [userId];
        }
        else if (userRole === types_1.UserRole.ORGANIZER) {
            // Organizers see their own events
            query = `
        SELECT e.id, e.name, e.description, e.department, e.date, e.qr_code, e.created_at,
               u.name as organizer_name, u.email as organizer_email,
               COUNT(ea.user_id)::integer as attendee_count
        FROM events e
        JOIN users u ON e.organizer_id = u.id
        LEFT JOIN event_attendance ea ON e.id = ea.event_id
        WHERE e.organizer_id = $1
        GROUP BY e.id, u.name, u.email
        ORDER BY e.date ASC
      `;
            params = [userId];
        }
        else {
            // Faculty and Admin see all events
            query = `
        SELECT e.id, e.name, e.description, e.department, e.date, e.created_at,
               u.name as organizer_name, u.email as organizer_email,
               COUNT(ea.user_id)::integer as attendee_count
        FROM events e
        JOIN users u ON e.organizer_id = u.id
        LEFT JOIN event_attendance ea ON e.id = ea.event_id
        GROUP BY e.id, u.name, u.email
        ORDER BY e.date ASC
      `;
        }
        const result = await database_1.default.query(query, params);
        res.json({ events: result.rows });
    }
    catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getEvents = getEvents;
const getEventQRCode = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const userRole = req.user.role;
        const userId = req.user.id;
        // Check if event exists and user has permission
        let query = 'SELECT id, qr_code, organizer_id FROM events WHERE id = $1';
        let params = [eventId];
        if (userRole === types_1.UserRole.ORGANIZER) {
            query += ' AND organizer_id = $2';
            params.push(userId);
        }
        const result = await database_1.default.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found or insufficient permissions' });
        }
        const event = result.rows[0];
        res.json({ qr_code: event.qr_code });
    }
    catch (error) {
        console.error('Get QR code error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getEventQRCode = getEventQRCode;
const checkinToEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const { qr_data } = req.body;
        const userId = req.user.id;
        // Verify QR data
        const qrPayload = (0, qrService_1.verifyQRData)(qr_data);
        if (!qrPayload) {
            return res.status(400).json({ error: 'Invalid or expired QR code' });
        }
        if (qrPayload.eventId !== eventId) {
            return res.status(400).json({ error: 'QR code does not match the event' });
        }
        // Check if event exists and is active
        const eventResult = await database_1.default.query('SELECT id, name, date FROM events WHERE id = $1 AND date > NOW() - INTERVAL \'1 day\'', [eventId]);
        if (eventResult.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found or no longer active' });
        }
        // Check if user is already checked in
        const existingAttendance = await database_1.default.query('SELECT id FROM event_attendance WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
        if (existingAttendance.rows.length > 0) {
            return res.status(400).json({ error: 'You are already checked in to this event' });
        }
        // Check in the user
        const attendanceResult = await database_1.default.query(`
      INSERT INTO event_attendance (event_id, user_id)
      VALUES ($1, $2)
      RETURNING id, timestamp
    `, [eventId, userId]);
        // Update cache
        await (0, cacheService_1.updateEventAttendance)(eventId, userId);
        res.json({
            message: 'Successfully checked in to the event',
            attendance: {
                id: attendanceResult.rows[0].id,
                event_id: eventId,
                user_id: userId,
                timestamp: attendanceResult.rows[0].timestamp
            }
        });
    }
    catch (error) {
        console.error('Checkin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.checkinToEvent = checkinToEvent;
const getEventStudents = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const { division, department } = req.query;
        // Check cache first
        const cached = await (0, cacheService_1.getCachedStudentList)(eventId, division, department);
        if (cached) {
            return res.json({ students: cached, from_cache: true });
        }
        // Build query
        let query = `
      SELECT u.id, u.name, u.email, u.roll_no, u.division, u.department, ea.timestamp
      FROM users u
      JOIN event_attendance ea ON u.id = ea.user_id
      WHERE ea.event_id = $1 AND u.role = 'STUDENT'
    `;
        const params = [eventId];
        if (division) {
            query += ' AND u.division = $' + (params.length + 1);
            params.push(division);
        }
        if (department) {
            query += ' AND u.department = $' + (params.length + 1);
            params.push(department);
        }
        query += ' ORDER BY ea.timestamp DESC';
        const result = await database_1.default.query(query, params);
        const students = result.rows;
        // Cache the result
        await (0, cacheService_1.cacheStudentList)(eventId, students, division, department);
        res.json({ students, from_cache: false });
    }
    catch (error) {
        console.error('Get event students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getEventStudents = getEventStudents;
const getEventById = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const userId = req.user.id;
        const userRole = req.user.role;
        let query = `
      SELECT e.id, e.name, e.description, e.department, e.date, e.created_at,
             u.name as organizer_name, u.email as organizer_email,
             COUNT(ea.user_id) as attendee_count`;
        // Add attendance status for students
        if (userRole === types_1.UserRole.STUDENT) {
            query += `,
             CASE WHEN user_ea.user_id IS NOT NULL THEN true ELSE false END as is_attending`;
        }
        query += `
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      LEFT JOIN event_attendance ea ON e.id = ea.event_id`;
        // Add user-specific attendance join for students
        if (userRole === types_1.UserRole.STUDENT) {
            query += `
      LEFT JOIN event_attendance user_ea ON e.id = user_ea.event_id AND user_ea.user_id = $2`;
        }
        query += `
      WHERE e.id = $1
      GROUP BY e.id, u.name, u.email`;
        // Add user attendance status to GROUP BY for students
        if (userRole === types_1.UserRole.STUDENT) {
            query += `, user_ea.user_id`;
        }
        const params = userRole === types_1.UserRole.STUDENT ? [eventId, userId] : [eventId];
        const result = await database_1.default.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json({ event: result.rows[0] });
    }
    catch (error) {
        console.error('Get event by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getEventById = getEventById;
