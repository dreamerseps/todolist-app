import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import React from 'react';
import apiClient from '@/api/client';
import { useUpdateTodo } from '../useUpdateTodo';
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
  id: '1', user_id: 'u1', category_id: 'c1', title: '수정된 할일',
  description: null, due_date: null, is_completed: false,
  created_at: '2026-05-14T00:00:00Z', updated_at: '2026-05-14T00:00:00Z',
};

test('수정 성공 시 success 토스트 표시', async () => {
  mock.onPatch('/todos/1').reply(200, { success: true, code: 'OK', data: mockTodo });

  const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper() });

  act(() => {
    result.current.mutate({ id: '1', body: { title: '수정된 할일' } });
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  const toasts = useUiStore.getState().toasts;
  expect(toasts.some((t) => t.type === 'success')).toBe(true);
});

test('완료 토글 시 토스트 미표시', async () => {
  mock.onPatch('/todos/1').reply(200, { success: true, code: 'OK', data: { ...mockTodo, is_completed: true } });

  const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper() });

  act(() => {
    result.current.mutate({ id: '1', body: { is_completed: true } });
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  const toasts = useUiStore.getState().toasts;
  expect(toasts.length).toBe(0);
});

test('수정 실패 시 error 토스트 표시', async () => {
  mock.onPatch('/todos/1').reply(400, { success: false, code: 'BAD_REQUEST' });

  const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper() });

  act(() => {
    result.current.mutate({ id: '1', body: { title: '실패' } });
  });

  await waitFor(() => expect(result.current.isError).toBe(true));

  const toasts = useUiStore.getState().toasts;
  expect(toasts.some((t) => t.type === 'error')).toBe(true);
});
