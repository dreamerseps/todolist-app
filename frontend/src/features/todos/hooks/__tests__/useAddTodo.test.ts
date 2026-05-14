import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import React from 'react';
import apiClient from '@/api/client';
import { useAddTodo } from '../useAddTodo';
import { useUiStore } from '@/stores/uiStore';

const mock = new AxiosMockAdapter(apiClient);

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

afterEach(() => {
  mock.reset();
  useUiStore.getState().toasts.forEach((t) => useUiStore.getState().removeToast(t.id));
});

const mockTodo = {
  id: '1', user_id: 'u1', category_id: 'c1', title: '새 할일',
  description: null, due_date: null, is_completed: false,
  created_at: '2026-05-14T00:00:00Z', updated_at: '2026-05-14T00:00:00Z',
};

test('성공 시 success 토스트 표시', async () => {
  mock.onPost('/todos').reply(201, { success: true, code: 'CREATED', data: mockTodo });

  const { result } = renderHook(() => useAddTodo(), { wrapper: createWrapper() });

  act(() => {
    result.current.mutate({ title: '새 할일', category_id: 'c1' });
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  const toasts = useUiStore.getState().toasts;
  expect(toasts.some((t) => t.type === 'success')).toBe(true);
});

test('실패 시 error 토스트 표시', async () => {
  mock.onPost('/todos').reply(400, { success: false, code: 'BAD_REQUEST' });

  const { result } = renderHook(() => useAddTodo(), { wrapper: createWrapper() });

  act(() => {
    result.current.mutate({ title: '새 할일', category_id: 'c1' });
  });

  await waitFor(() => expect(result.current.isError).toBe(true));

  const toasts = useUiStore.getState().toasts;
  expect(toasts.some((t) => t.type === 'error')).toBe(true);
});

test('isPending 상태 전이', async () => {
  mock.onPost('/todos').reply(201, { success: true, code: 'CREATED', data: mockTodo });

  const { result } = renderHook(() => useAddTodo(), { wrapper: createWrapper() });

  expect(result.current.isPending).toBe(false);
});
