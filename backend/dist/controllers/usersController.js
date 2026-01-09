"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserStats = exports.getUserById = exports.getUsers = void 0;
const database_1 = __importDefault(require("../config/database"));
const types_1 = require("../types");
// Get all users with optional filtering
const getUsers = async (req, res) => {
    try {
        const { role, department } = req.query;
        let query = 'SELECT id, name, email, roll_no, division, department, role, created_at FROM users WHERE 1=1';
        const queryParams = [];
        if (role) {
            query += ' AND role = $' + (queryParams.length + 1);
            queryParams.push(role);
        }
        if (department) {
            query += ' AND department = $' + (queryParams.length + 1);
            queryParams.push(department);
        }
        query += ' ORDER BY name';
        const result = await database_1.default.query(query, queryParams);
        res.json({
            users: result.rows
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};
exports.getUsers = getUsers;
// Get user by ID
const getUserById = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        const result = await database_1.default.query('SELECT id, name, email, roll_no, division, department, role, created_at FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            user: result.rows[0]
        });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};
exports.getUserById = getUserById;
// Get user statistics
const getUserStats = async (req, res) => {
    try {
        const queries = [
            'SELECT COUNT(*) as total_users FROM users',
            'SELECT COUNT(*) as students FROM users WHERE role = $1',
            'SELECT COUNT(*) as faculty FROM users WHERE role = $2',
            'SELECT COUNT(*) as organizers FROM users WHERE role = $3',
            'SELECT department, COUNT(*) as count FROM users GROUP BY department ORDER BY count DESC',
            'SELECT COUNT(*) as recent_signups FROM users WHERE created_at >= NOW() - INTERVAL \'30 days\''
        ];
        const [totalResult, studentsResult, facultyResult, organizersResult, departmentResult, recentResult] = await Promise.all([
            database_1.default.query(queries[0]),
            database_1.default.query(queries[1], [types_1.UserRole.STUDENT]),
            database_1.default.query(queries[2], [types_1.UserRole.FACULTY]),
            database_1.default.query(queries[3], [types_1.UserRole.ORGANIZER]),
            database_1.default.query(queries[4]),
            database_1.default.query(queries[5])
        ]);
        res.json({
            stats: {
                total_users: parseInt(totalResult.rows[0].total_users),
                students: parseInt(studentsResult.rows[0].students),
                faculty: parseInt(facultyResult.rows[0].faculty),
                organizers: parseInt(organizersResult.rows[0].organizers),
                departments: departmentResult.rows,
                recent_signups: parseInt(recentResult.rows[0].recent_signups)
            }
        });
    }
    catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
};
exports.getUserStats = getUserStats;
