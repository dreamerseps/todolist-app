import type { TodoFilter } from '@/types';

export const queryKeys = {
  me: ['me'] as const,
  categories: ['categories'] as const,
  todos: (filter?: TodoFilter) => ['todos', filter] as const,
  todo: (id: string) => ['todos', id] as const,
};
