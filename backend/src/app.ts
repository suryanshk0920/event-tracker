import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import usersRoutes from './routes/users';
import { generalLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all requests
app.use(generalLimiter);

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
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', usersRoutes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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

export default app;