import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import React from 'react';
import apiClient from '@/api/client';
import { useAddCategory } from '../useAddCategory';
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

const mockCategory = { id: 'c1', user_id: 'u1', name: '새 카테고리', is_default: false };

test('성공 시 success 토스트 표시', async () => {
  mock.onPost('/categories').reply(201, { success: true, code: 'CREATED', data: mockCategory });

  const { result } = renderHook(() => useAddCategory(), { wrapper: createWrapper() });

  act(() => { result.current.mutate({ name: '새 카테고리' }); });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(useUiStore.getState().toasts.some((t) => t.type === 'success')).toBe(true);
});

test('실패 시 error 토스트 표시', async () => {
  mock.onPost('/categories').reply(400);

  const { result } = renderHook(() => useAddCategory(), { wrapper: createWrapper() });

  act(() => { result.current.mutate({ name: '새 카테고리' }); });

  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(useUiStore.getState().toasts.some((t) => t.type === 'error')).toBe(true);
});
