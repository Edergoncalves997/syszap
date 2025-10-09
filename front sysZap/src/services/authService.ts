import api from './api';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../types/api';

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  // Register
  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', userData);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  // Get current user
  async me(): Promise<{ user: User }> {
    const { data } = await api.get<{ user: User }>('/auth/me');
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  // Logout
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Get token
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  // Get stored user
  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};



