import { Request, Response, NextFunction } from 'express';
import { JWTPayload, UserRole } from '../types';
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireRole: (roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireStudent: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireFaculty: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireOrganizer: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireFacultyOrAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireOrganizerOrAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
