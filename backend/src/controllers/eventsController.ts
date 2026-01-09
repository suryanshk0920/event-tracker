import { Request, Response } from 'express';
import pool from '../config/database';
import { CreateEventRequest, CheckinRequest, StudentsQueryParams, UserRole } from '../types';
import { generateQRCodeForEvent, verifyQRData } from '../services/qrService';
import {
  cacheStudentList,
  getCachedStudentList,
  updateEventAttendance,
  isUserAttending
} from '../services/cacheService';
import { sseService } from '../services/sseService';
import { randomUUID } from 'crypto';

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { name, description, department, date }: CreateEventRequest = req.body;
    const organizerId = req.user!.id;

    // Insert event
    const result = await pool.query(`
      INSERT INTO events (name, description, department, date, organizer_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, department, date, organizer_id, created_at
    `, [name, description || null, department, new Date(date), organizerId]);

    const event = result.rows[0];

    // Generate QR code for the event
    const qrCode = await generateQRCodeForEvent(event.id);

    // Update event with QR code
    await pool.query('UPDATE events SET qr_code = $1 WHERE id = $2', [qrCode, event.id]);

    res.status(201).json({
      message: 'Event created successfully',
      event: {
        ...event,
        qr_code: qrCode
      }
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const userRole = req.user!.role;
    const userId = req.user!.id;
    const { student_id } = req.query;

    let query = '';
    let params: any[] = [];

    // Check if we should show student view (either logged in as student, or admin/faculty viewing specific student)
    const targetStudentId = (userRole === UserRole.ADMIN || userRole === UserRole.FACULTY) && student_id
      ? parseInt(student_id as string)
      : null;

    if (userRole === UserRole.STUDENT || targetStudentId) {
      // Students (or admins viewing student) see all events with attendance status for that student
      const subjectId = targetStudentId || userId;

      query = `
        SELECT e.id, e.name, e.description, e.department, e.date, e.created_at,
               u.name as organizer_name,
               CASE WHEN ea.user_id IS NOT NULL THEN true ELSE false END as is_attending
        FROM events e
        JOIN users u ON e.organizer_id = u.id
        LEFT JOIN event_attendance ea ON e.id = ea.event_id AND ea.user_id = $1
        ORDER BY e.date DESC
      `;
      params = [subjectId];
    } else if (userRole === UserRole.ORGANIZER) {
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
    } else {
      // Faculty and Admin see all events (summary view)
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

    const result = await pool.query(query, params);
    res.json({ events: result.rows });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEventQRCode = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const userRole = req.user!.role;
    const userId = req.user!.id;

    // Check if event exists and user has permission
    let query = 'SELECT id, qr_code, organizer_id FROM events WHERE id = $1';
    let params = [eventId];

    if (userRole === UserRole.ORGANIZER) {
      query += ' AND organizer_id = $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or insufficient permissions' });
    }

    const event = result.rows[0];

    res.json({ qr_code: event.qr_code });

  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkinToEvent = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const { qr_data }: CheckinRequest = req.body;
    const userId = req.user!.id;

    // Verify QR data
    const qrPayload = verifyQRData(qr_data);
    if (!qrPayload) {
      return res.status(400).json({ error: 'Invalid or expired QR code' });
    }

    if (qrPayload.eventId !== eventId) {
      return res.status(400).json({ error: 'QR code does not match the event' });
    }

    // Check if event exists and is active
    const eventResult = await pool.query(
      'SELECT id, name, date FROM events WHERE id = $1 AND date > NOW() - INTERVAL \'1 day\'',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or no longer active' });
    }

    // Check if user is already checked in
    const existingAttendance = await pool.query(
      'SELECT id FROM event_attendance WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (existingAttendance.rows.length > 0) {
      return res.status(400).json({ error: 'You are already checked in to this event' });
    }

    // Check in the user
    const attendanceResult = await pool.query(`
      INSERT INTO event_attendance (event_id, user_id)
      VALUES ($1, $2)
      RETURNING id, timestamp
    `, [eventId, userId]);

    // Get user details for broadcasting
    const userResult = await pool.query(
      'SELECT id, name, email, roll_no, division, department FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    // Update cache
    await updateEventAttendance(eventId, userId);

    // Broadcast to SSE clients
    sseService.broadcast(eventId, {
      type: 'new_attendance',
      data: {
        attendance: {
          id: attendanceResult.rows[0].id,
          event_id: eventId,
          user_id: userId,
          timestamp: attendanceResult.rows[0].timestamp
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roll_no: user.roll_no,
          division: user.division,
          department: user.department
        }
      }
    });

    res.json({
      message: 'Successfully checked in to the event',
      attendance: {
        id: attendanceResult.rows[0].id,
        event_id: eventId,
        user_id: userId,
        timestamp: attendanceResult.rows[0].timestamp
      }
    });

  } catch (error) {
    console.error('Checkin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const attendanceStream = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const userRole = req.user!.role;

    // Only faculty, organizers, and admins can stream attendance
    if (userRole === UserRole.STUDENT) {
      return res.status(403).json({ error: 'Unauthorized to stream attendance data' });
    }

    // Verify event exists
    const eventResult = await pool.query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Generate unique client ID
    const clientId = randomUUID();

    // Add client to SSE service
    sseService.addClient(eventId, res, clientId);

    // Handle client disconnect
    req.on('close', () => {
      sseService.removeClient(eventId, clientId);
    });

  } catch (error) {
    console.error('SSE stream error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEventStudents = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const { division, department }: StudentsQueryParams = req.query as any;

    // Check cache first
    const cached = await getCachedStudentList(eventId, division, department);
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
    const params: any[] = [eventId];

    if (division) {
      query += ' AND u.division = $' + (params.length + 1);
      params.push(division);
    }

    if (department) {
      query += ' AND u.department = $' + (params.length + 1);
      params.push(department);
    }

    query += ' ORDER BY ea.timestamp DESC';

    const result = await pool.query(query, params);
    const students = result.rows;

    // Cache the result
    await cacheStudentList(eventId, students, division, department);

    res.json({ students, from_cache: false });

  } catch (error) {
    console.error('Get event students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let query = `
      SELECT e.id, e.name, e.description, e.department, e.date, e.created_at,
             u.name as organizer_name, u.email as organizer_email,
             COUNT(ea.user_id) as attendee_count`;

    // Add attendance status for students
    if (userRole === UserRole.STUDENT) {
      query += `,
             CASE WHEN user_ea.user_id IS NOT NULL THEN true ELSE false END as is_attending`;
    }

    query += `
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      LEFT JOIN event_attendance ea ON e.id = ea.event_id`;

    // Add user-specific attendance join for students
    if (userRole === UserRole.STUDENT) {
      query += `
      LEFT JOIN event_attendance user_ea ON e.id = user_ea.event_id AND user_ea.user_id = $2`;
    }

    query += `
      WHERE e.id = $1
      GROUP BY e.id, u.name, u.email`;

    // Add user attendance status to GROUP BY for students
    if (userRole === UserRole.STUDENT) {
      query += `, user_ea.user_id`;
    }

    const params = userRole === UserRole.STUDENT ? [eventId, userId] : [eventId];
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event: result.rows[0] });

  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const eventId = parseInt(req.params.id);
    const userId = req.user!.id;
    const userRole = req.user!.role;

    await client.query('BEGIN');

    // Check if event exists and user has permission
    const eventResult = await client.query('SELECT id, organizer_id FROM events WHERE id = $1', [eventId]);

    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    // Permission check: Admin can delete any, Organizer only their own
    if (userRole !== UserRole.ADMIN && (userRole !== UserRole.ORGANIZER || event.organizer_id !== userId)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'You do not have permission to delete this event' });
    }

    // Delete attendance records first (in case cascading is not set up)
    await client.query('DELETE FROM event_attendance WHERE event_id = $1', [eventId]);

    // Delete the event
    await client.query('DELETE FROM events WHERE id = $1', [eventId]);

    await client.query('COMMIT');

    res.json({ message: 'Event deleted successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
