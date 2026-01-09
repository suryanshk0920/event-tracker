import axios from 'axios';
import Cookies from 'js-cookie';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CreateEventRequest,
  CheckinRequest,
  User,
  Event,
  AttendingStudent,
  UserRole
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<{ message: string; user: User }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },
};

// Events API
export const eventsAPI = {
  getEvents: async (params?: { student_id?: number }): Promise<{ events: Event[] }> => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getEvent: async (id: number): Promise<{ event: Event }> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (data: CreateEventRequest): Promise<{ message: string; event: Event }> => {
    const response = await api.post('/events', data);
    return response.data;
  },

  getEventQRCode: async (id: number): Promise<{ qr_code: string }> => {
    const response = await api.get(`/events/${id}/qrcode`);
    return response.data;
  },

  checkinToEvent: async (id: number, data: CheckinRequest): Promise<{ message: string }> => {
    const response = await api.post(`/events/${id}/checkin`, data);
    return response.data;
  },

  getEventStudents: async (
    id: number,
    params?: { division?: string; department?: string }
  ): Promise<{ students: AttendingStudent[]; from_cache?: boolean }> => {
    const response = await api.get(`/events/${id}/students`, { params });
    return response.data;
  },

  deleteEvent: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getUsers: async (params?: { role?: UserRole; department?: string }): Promise<{ users: User[] }> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUser: async (id: number): Promise<{ user: User }> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
};

// Health check
export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
