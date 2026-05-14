import apiClient from './client';
import type { ApiResponse, Category, CategoryCreateRequest, CategoryUpdateRequest } from '@/types';

export const categoriesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Category[]>>('/categories'),

  create: (body: CategoryCreateRequest) =>
    apiClient.post<ApiResponse<Category>>('/categories', body),

  update: (id: string, body: CategoryUpdateRequest) =>
    apiClient.patch<ApiResponse<Category>>(`/categories/${id}`, body),

  delete: (id: string) =>
    apiClient.delete<ApiResponse>(`/categories/${id}`),
};
