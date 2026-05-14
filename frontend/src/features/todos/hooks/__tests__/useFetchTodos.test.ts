import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, vi } from 'vitest';
import React from 'react';
import apiClient from '@/api/client';
import { useFetchTodos } from '../useFetchTodos';

const mock = new AxiosMockAdapter(apiClient);

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

afterEach(() => {
  mock.reset();
});

const mockTodo = {
  id: '1',
  user_id: 'u1',
  category_id: 'c1',
  title: '테스트 할일',
  description: null,
  due_date: null,
  is_completed: false,
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

const mockResponse = {
  success: true,
  code: 'OK',
  data: { todos: [mockTodo], total: 1, page: 1, pageSize: 20, totalPages: 1 },
};

test('성공 시 todos 데이터 반환', async () => {
  mock.onGet('/todos').reply(200, mockResponse);

  const { result } = renderHook(() => useFetchTodos(), { wrapper: createWrapper() });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data?.todos).toHaveLength(1);
  expect(result.current.data?.todos[0].title).toBe('테스트 할일');
});

test('isLoading 초기 상태', () => {
  mock.onGet('/todos').reply(200, mockResponse);

  const { result } = renderHook(() => useFetchTodos(), { wrapper: createWrapper() });

  expect(result.current.isLoading).toBe(true);
});

test('필터 파라미터 전달', async () => {
  mock.onGet('/todos').reply(200, mockResponse);

  const { result } = renderHook(() => useFetchTodos({ page: 2, is_completed: false }), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data?.todos).toBeDefined();
});

test('API 오류 시 isError 상태', async () => {
  mock.onGet('/todos').reply(500);

  const { result } = renderHook(() => useFetchTodos(), { wrapper: createWrapper() });

  await waitFor(() => expect(result.current.isError).toBe(true));
});
