"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const validation_2 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = express_1.default.Router();
// Public routes
router.post('/register', rateLimiter_1.registerLimiter, (0, validation_1.validateBody)(validation_2.registerSchema), authController_1.register);
router.post('/login', rateLimiter_1.loginLimiter, (0, validation_1.validateBody)(validation_2.loginSchema), authController_1.login);
// Protected routes
router.get('/profile', auth_1.authenticateToken, authController_1.getProfile);
exports.default = router;
