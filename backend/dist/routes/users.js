"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const usersController_1 = require("../controllers/usersController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Get all users (faculty and admin only)
router.get('/', auth_1.requireFacultyOrAdmin, usersController_1.getUsers);
// Get user statistics (admin only)
router.get('/stats', auth_1.requireAdmin, usersController_1.getUserStats);
// Get user by ID (faculty and admin only)
router.get('/:id', auth_1.requireFacultyOrAdmin, usersController_1.getUserById);
exports.default = router;
