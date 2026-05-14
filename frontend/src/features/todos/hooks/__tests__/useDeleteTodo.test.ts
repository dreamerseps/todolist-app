import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import React from 'react';
import apiClient from '@/api/client';
import { useDeleteTodo } from '../useDeleteTodo';
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

test('삭제 성공 시 success 토스트 표시', async () => {
  mock.onDelete('/todos/1').reply(200, { success: true, code: 'OK' });

  const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper() });

  act(() => {
    result.current.mutate('1');
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  const toasts = useUiStore.getState().toasts;
  expect(toasts.some((t) => t.type === 'success')).toBe(true);
});

test('삭제 실패 시 error 토스트 표시', async () => {
  mock.onDelete('/todos/1').reply(500);

  const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper() });

  act(() => {
    result.current.mutate('1');
  });

  await waitFor(() => expect(result.current.isError).toBe(true));

  const toasts = useUiStore.getState().toasts;
  expect(toasts.some((t) => t.type === 'error')).toBe(true);
});

test('isPending 초기 상태는 false', () => {
  const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper() });
  expect(result.current.isPending).toBe(false);
});
