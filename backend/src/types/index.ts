export enum UserRole {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: number;
  name: string;
  email: string;
  roll_no?: string;
  division?: string;
  department: string;
  role: UserRole;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Event {
  id: number;
  name: string;
  description?: string;
  department: string;
  date: Date;
  organizer_id: number;
  qr_code?: string;
  created_at: Date;
  updated_at: Date;
}

export interface EventAttendance {
  id: number;
  event_id: number;
  user_id: number;
  timestamp: Date;
}

export interface JWTPayload {
  id: number;
  role: UserRole;
  department: string;
}

export interface AuthRequest {
  user?: JWTPayload;
}

// Request/Response Types
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  roll_no?: string;
  division?: string;
  department: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  department: string;
  date: string;
}

export interface CheckinRequest {
  qr_data: string;
}

export interface StudentsQueryParams {
  division?: string;
  department?: string;
}