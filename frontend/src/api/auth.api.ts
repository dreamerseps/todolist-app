import apiClient from './client';
import type { ApiResponse, User } from '@/types';

type LoginResponseData = {
  access_token: string;
  refresh_token: string;
  user: User;
};

export const authApi = {
  register: (body: { email: string; password: string; name: string }) =>
    apiClient.post<ApiResponse<User>>('/auth/register', body),

  login: (body: { email: string; password: string }) =>
    apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', body),

  refresh: (refresh_token: string) =>
    apiClient.post<ApiResponse<{ access_token: string }>>('/auth/refresh', { refresh_token }),

  logout: () =>
    apiClient.post<ApiResponse>('/auth/logout'),
};
