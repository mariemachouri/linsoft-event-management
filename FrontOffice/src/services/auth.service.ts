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

      // Decode JWT payload — Keycloak includes email, given_name, family_name
      const payload = JSON.parse(atob(token.split('.')[1]));
      const username: string = payload.preferred_username || payload.sub || '';
      if (!username) return null;

      // Build a minimal profile from the JWT claims so we always have data
      const jwtProfile: UserProfile = {
        id:          payload.sub ?? '',
        username,
        email:       payload.email        ?? '',
        firstName:   payload.given_name   ?? '',
        lastName:    payload.family_name  ?? '',
        phoneNumber: undefined,
        roles:       payload.realm_access?.roles ?? [],
      };

      // Try to enrich with MongoDB profile (may contain phoneNumber, avatarUrl, etc.)
      try {
        const response = await api.get<UserProfile[]>('/users');
        const found = response.data.find((u) => u.username === username);
        if (found) {
          // Prefer DB data for editable fields, JWT for auth fields
          return {
            ...jwtProfile,
            id:          found.id          || jwtProfile.id,
            email:       found.email       || jwtProfile.email,
            firstName:   found.firstName   || jwtProfile.firstName,
            lastName:    found.lastName    || jwtProfile.lastName,
            phoneNumber: found.phoneNumber,
            roles:       found.roles       ?? jwtProfile.roles,
          };
        }
      } catch {
        // API unavailable — fall back to JWT data
      }

      return jwtProfile;
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
