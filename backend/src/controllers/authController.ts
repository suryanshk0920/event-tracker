import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { RegisterRequest, LoginRequest, UserRole, JWTPayload } from '../types';
import { generatePassword } from '../utils/passwordGenerator';
import { sendCredentialsEmail } from '../services/emailService';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, roll_no, division, department, role }: Omit<RegisterRequest, 'password'> = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // For students, roll_no and division are required
    if (role === UserRole.STUDENT) {
      if (!roll_no || !division) {
        return res.status(400).json({
          error: 'Roll number and division are required for students'
        });
      }

      // Check if roll number already exists in the same department
      const existingRollNo = await pool.query(
        'SELECT id FROM users WHERE roll_no = $1 AND department = $2',
        [roll_no, department]
      );

      if (existingRollNo.rows.length > 0) {
        return res.status(400).json({
          error: 'Roll number already exists in this department'
        });
      }
    }

    // Generate a random password
    const generatedPassword = generatePassword(12);

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(generatedPassword, saltRounds);

    // Insert user
    const result = await pool.query(`
      INSERT INTO users (name, email, roll_no, division, department, role, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, roll_no, division, department, role, created_at
    `, [name, email, roll_no || null, division || null, department, role, password_hash]);

    const user = result.rows[0];

    // Send credentials via email
    try {
      await sendCredentialsEmail({
        email: user.email,
        password: generatedPassword,
        name: user.name,
        role: user.role,
      });
    } catch (emailError) {
      console.error('Failed to send credentials email:', emailError);
      // Delete the user if email sending fails
      await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
      return res.status(500).json({
        error: 'Failed to send credentials email. Please check email configuration and try again.'
      });
    }

    res.status(201).json({
      message: 'User registered successfully. Credentials have been sent to their email.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roll_no: user.roll_no,
        division: user.division,
        department: user.department,
        role: user.role,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Get user from database
    const result = await pool.query(
      'SELECT id, name, email, department, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT payload
    const payload: JWTPayload = {
      id: user.id,
      role: user.role,
      department: user.department
    };

    // Generate JWT token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await pool.query(`
      SELECT id, name, email, roll_no, division, department, role, created_at
      FROM users WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });

  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get current password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

