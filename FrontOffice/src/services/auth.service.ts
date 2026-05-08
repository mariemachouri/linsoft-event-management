import api from './api';
import type { LoginRequest, LoginResponse, RegisterRequest, UserProfile } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<UserProfile> {
    const response = await api.post<UserProfile>('/users', data);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      // Decode JWT payload to get sub (username)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const username: string = payload.preferred_username || payload.sub || '';
      if (!username) return null;
      const response = await api.get<UserProfile[]>('/users');
      const users = response.data;
      return users.find((u) => u.username === username) || null;
    } catch {
      return null;
    }
  },

  async updateProfile(id: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await api.put<UserProfile>(`/users/${id}`, data);
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};
