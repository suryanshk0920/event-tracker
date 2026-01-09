import { Request, Response } from 'express';
export declare const getUsers: (req: Request, res: Response) => Promise<void>;
export declare const getUserById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserStats: (req: Request, res: Response) => Promise<void>;
