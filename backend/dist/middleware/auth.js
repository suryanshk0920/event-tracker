"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOrganizerOrAdmin = exports.requireFacultyOrAdmin = exports.requireAdmin = exports.requireOrganizer = exports.requireFaculty = exports.requireStudent = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("../types");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    });
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireStudent = (0, exports.requireRole)([types_1.UserRole.STUDENT]);
exports.requireFaculty = (0, exports.requireRole)([types_1.UserRole.FACULTY]);
exports.requireOrganizer = (0, exports.requireRole)([types_1.UserRole.ORGANIZER]);
exports.requireAdmin = (0, exports.requireRole)([types_1.UserRole.ADMIN]);
exports.requireFacultyOrAdmin = (0, exports.requireRole)([types_1.UserRole.FACULTY, types_1.UserRole.ADMIN]);
exports.requireOrganizerOrAdmin = (0, exports.requireRole)([types_1.UserRole.ORGANIZER, types_1.UserRole.ADMIN]);
