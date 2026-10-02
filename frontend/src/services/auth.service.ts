import apiClient from './api.client';
import { API_ENDPOINTS, JWT_TOKEN_KEY } from '@/lib/constants';
import type { User, LoginFormData, RegisterFormData, ProfileFormData, ChangePasswordFormData } from '@/types';

// ─── Auth Payload Types ───────────────────────────────────────────────────────

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  async login(data: LoginFormData): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH_LOGIN, data);
    return res.data;
  },

  async register(data: RegisterFormData): Promise<LoginResponse> {
    const { confirmPassword: _, ...payload } = data;
    const res = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH_REGISTER, payload);
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT);
    } finally {
      localStorage.removeItem(JWT_TOKEN_KEY);
    }
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const res = await apiClient.post<RefreshTokenResponse>(API_ENDPOINTS.AUTH_REFRESH, {
      refreshToken,
    });
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<User>(API_ENDPOINTS.AUTH_ME);
    return res.data;
  },

  async updateProfile(data: ProfileFormData): Promise<User> {
    const res = await apiClient.patch<User>(API_ENDPOINTS.PROFILE_UPDATE, data);
    return res.data;
  },

  async changePassword(data: ChangePasswordFormData): Promise<void> {
    const { confirmPassword: _, ...payload } = data;
    await apiClient.post(API_ENDPOINTS.CHANGE_PASSWORD, payload);
  },
};
