import type { PaginationMeta } from './common';

export type TodoItem = {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type TodoFilter = {
  category_id?: string;
  from?: string;
  to?: string;
  is_completed?: boolean;
  sort?: 'created_at' | 'due_date';
  page?: number;
  limit?: number;
};

export type TodoCreateRequest = {
  title: string;
  category_id: string;
  description?: string;
  due_date?: string;
};

export type TodoUpdateRequest = {
  title?: string;
  description?: string | null;
  category_id?: string;
  due_date?: string | null;
  is_completed?: boolean;
};

export type PaginatedResponse<T> = {
  todos: T[];
  pagination: PaginationMeta;
};
