import apiClient from './client';
import type { ApiResponse, User, UpdateProfileRequest } from '@/types';

export const usersApi = {
  getMe: () =>
    apiClient.get<ApiResponse<User>>('/users/me'),

  updateMe: (body: UpdateProfileRequest) =>
    apiClient.patch<ApiResponse<User>>('/users/me', body),
};
