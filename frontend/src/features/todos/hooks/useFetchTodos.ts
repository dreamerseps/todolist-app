import { useQuery } from '@tanstack/react-query';
import { todosApi } from '@/api/todos.api';
import { queryKeys } from '@/api/queryKeys';
import type { TodoFilter, TodoItem } from '@/types';

type RawTodosResponse = {
  todos: TodoItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export function useFetchTodos(filter?: TodoFilter) {
  return useQuery({
    queryKey: queryKeys.todos(filter),
    queryFn: async () => {
      const { data } = await todosApi.getAll(filter);
      const raw = data.data as unknown as RawTodosResponse;
      return {
        todos: raw.todos,
        pagination: {
          page: raw.page,
          limit: raw.page_size,
          total: raw.total,
          total_pages: raw.total_pages,
        },
      };
    },
  });
}
