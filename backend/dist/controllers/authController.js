"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const types_1 = require("../types");
const register = async (req, res) => {
    try {
        const { name, email, password, roll_no, division, department, role } = req.body;
        // Check if user already exists
        const existingUser = await database_1.default.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        // For students, roll_no and division are required
        if (role === types_1.UserRole.STUDENT) {
            if (!roll_no || !division) {
                return res.status(400).json({
                    error: 'Roll number and division are required for students'
                });
            }
            // Check if roll number already exists in the same department
            const existingRollNo = await database_1.default.query('SELECT id FROM users WHERE roll_no = $1 AND department = $2', [roll_no, department]);
            if (existingRollNo.rows.length > 0) {
                return res.status(400).json({
                    error: 'Roll number already exists in this department'
                });
            }
        }
        // Hash password
        const saltRounds = 12;
        const password_hash = await bcrypt_1.default.hash(password, saltRounds);
        // Insert user
        const result = await database_1.default.query(`
      INSERT INTO users (name, email, roll_no, division, department, role, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, roll_no, division, department, role, created_at
    `, [name, email, roll_no || null, division || null, department, role, password_hash]);
        const user = result.rows[0];
        res.status(201).json({
            message: 'User registered successfully',
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
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Get user from database
        const result = await database_1.default.query('SELECT id, name, email, department, role, password_hash FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        // Verify password
        const isValidPassword = await bcrypt_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Create JWT payload
        const payload = {
            id: user.id,
            role: user.role,
            department: user.department
        };
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await database_1.default.query(`
      SELECT id, name, email, roll_no, division, department, role, created_at
      FROM users WHERE id = $1
    `, [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: result.rows[0] });
    }
    catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProfile = getProfile;
