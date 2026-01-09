"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const events_1 = __importDefault(require("./routes/events"));
const users_1 = __importDefault(require("./routes/users"));
const rateLimiter_1 = require("./middleware/rateLimiter");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Apply rate limiting to all requests
app.use(rateLimiter_1.generalLimiter);
// Health check
app.get('/api/health', (_req, res) => {
    const isLoadTesting = process.env.ENABLE_LOAD_TESTING === 'true';
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        loadTestingEnabled: isLoadTesting,
        rateLimitsRelaxed: isLoadTesting
    });
});
// Simpler health endpoint for load test script
app.get('/health', (_req, res) => {
    res.json({ status: 'OK' });
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/events', events_1.default);
app.use('/api/users', users_1.default);
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request entity too large' });
    }
    return res.status(500).json({ error: 'Internal server error' });
});
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
exports.default = app;
