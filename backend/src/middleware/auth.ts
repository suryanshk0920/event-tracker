import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, UserRole } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];

  // Support token in query parameter for SSE (EventSource doesn't support headers)
  const queryToken = req.query.token as string;

  const token = headerToken || queryToken;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded as JWTPayload;
    next();
  });
};

export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireStudent = requireRole([UserRole.STUDENT]);
export const requireFaculty = requireRole([UserRole.FACULTY]);
export const requireOrganizer = requireRole([UserRole.ORGANIZER]);
export const requireAdmin = requireRole([UserRole.ADMIN]);

export const requireFacultyOrAdmin = requireRole([UserRole.FACULTY, UserRole.ADMIN]);
export const requireOrganizerOrAdmin = requireRole([UserRole.ORGANIZER, UserRole.ADMIN]);