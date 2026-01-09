import { Request, Response } from 'express';
export declare const createEvent: (req: Request, res: Response) => Promise<void>;
export declare const getEvents: (req: Request, res: Response) => Promise<void>;
export declare const getEventQRCode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const checkinToEvent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getEventStudents: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getEventById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
