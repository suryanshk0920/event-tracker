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
  created_at: string;
  last_login?: string;
}

export interface Event {
  id: number;
  name: string;
  description?: string;
  department: string;
  date: string;
  organizer_name: string;
  organizer_email?: string;
  qr_code?: string;
  attendee_count?: number;
  is_attending?: boolean;
  created_at: string;
}

export interface EventAttendance {
  id: number;
  event_id: number;
  user_id: number;
  timestamp: string;
}

export interface AttendingStudent {
  id: number;
  name: string;
  email: string;
  roll_no?: string;
  division?: string;
  department: string;
  timestamp: string;
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

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
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

export interface ApiError {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}