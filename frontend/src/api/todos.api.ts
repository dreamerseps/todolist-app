import apiClient from './client';
import type { ApiResponse, TodoItem, TodoFilter, TodoCreateRequest, TodoUpdateRequest, PaginatedResponse } from '@/types';

export const todosApi = {
  getAll: (params?: TodoFilter) =>
    apiClient.get<ApiResponse<PaginatedResponse<TodoItem>>>('/todos', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<TodoItem>>(`/todos/${id}`),

  create: (body: TodoCreateRequest) =>
    apiClient.post<ApiResponse<TodoItem>>('/todos', body),

  update: (id: string, body: TodoUpdateRequest) =>
    apiClient.patch<ApiResponse<TodoItem>>(`/todos/${id}`, body),

  delete: (id: string) =>
    apiClient.delete<ApiResponse>(`/todos/${id}`),

  bulkDelete: (ids: string[]) =>
    apiClient.delete<ApiResponse<{ count: number }>>('/todos/bulk', { data: { ids } }),
};
