
import { authApi } from './api';
import { ResponseDto, User } from '../types';

type AuthTokens = { accessToken: string; refreshToken: string };
type PasswordResetPayload = { identifier: string; code: string; newPassword: string };

export const authService = {
  signUp: (payload: any) => authApi.post<ResponseDto>('/api/auth/sign-up', payload),

  verifySignUp: (payload: { identifier: string; code: string }) =>
    authApi.post<ResponseDto<AuthTokens>>('/api/auth/sign-up/verify', payload),

  signInInit: (payload: any) =>
    authApi.post<ResponseDto<{ maskedEmail: string }>>('/api/auth/sign-in', payload),

  signInVerify: (payload: { identifier: string; code: string }) =>
    authApi.post<ResponseDto<AuthTokens>>('/api/auth/sign-in/verify', payload),

  forgotPassword: (identifier: string) =>
    authApi.post<ResponseDto>('/api/auth/forgot-password', { identifier }),

  resetPassword: (payload: PasswordResetPayload) =>
    authApi.post<ResponseDto>('/api/auth/reset-password', payload),

  refresh: () => authApi.post<ResponseDto<AuthTokens>>('/api/auth/refresh'),

  logout: () => authApi.post<ResponseDto>('/api/auth/logout'),

  getMe: () => authApi.get<ResponseDto<User>>('/api/users/me'),

  updateProfile: (payload: any) => authApi.post<ResponseDto>('/api/users/update-profile', payload),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return authApi.post<ResponseDto>('/api/users/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  heartbeat: () => authApi.post('/api/users/heartbeat'),

  changePassword: (payload: any) => authApi.post<ResponseDto>('/api/users/change-password', payload),

  changeEmailInit: (newEmail: string) =>
    authApi.post<ResponseDto>('/api/users/change-email', { newEmail }),

  changeEmailVerify: (payload: { newEmail: string; code: string }) =>
    authApi.post<ResponseDto>('/api/users/change-email/verify', payload),

  searchUsers: (q: string, limit = 20) =>
    authApi.get<ResponseDto<any[]>>('/api/users/search', { params: { q, limit } }),

  getUserByUsername: (username: string) =>
    authApi.get<ResponseDto<User>>('/api/users/user-by-username', { params: { username } }),

  changeUsername: (newUsername: string) =>
    authApi.post<ResponseDto>('/api/users/change-username', { newUsername }),

  getDevices: () => authApi.get<ResponseDto<any[]>>('/api/auth/devices'),

  logoutDevice: (deviceId: string) => authApi.post<ResponseDto>(`/api/auth/devices/logout/${deviceId}`),

  logoutAllDevices: () => authApi.post<ResponseDto>('/api/auth/devices/logout-all'),
};
