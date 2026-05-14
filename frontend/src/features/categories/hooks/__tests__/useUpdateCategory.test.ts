import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import React from 'react';
import apiClient from '@/api/client';
import { useUpdateCategory } from '../useUpdateCategory';
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

test('수정 성공 시 success 토스트 표시', async () => {
  mock.onPatch('/categories/c1').reply(200, {
    success: true, code: 'OK',
    data: { id: 'c1', user_id: 'u1', name: '수정됨', is_default: false },
  });

  const { result } = renderHook(() => useUpdateCategory(), { wrapper: createWrapper() });

  act(() => { result.current.mutate({ id: 'c1', body: { name: '수정됨' } }); });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(useUiStore.getState().toasts.some((t) => t.type === 'success')).toBe(true);
});

test('수정 실패 시 error 토스트 표시', async () => {
  mock.onPatch('/categories/c1').reply(400);

  const { result } = renderHook(() => useUpdateCategory(), { wrapper: createWrapper() });

  act(() => { result.current.mutate({ id: 'c1', body: { name: '실패' } }); });

  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(useUiStore.getState().toasts.some((t) => t.type === 'error')).toBe(true);
});
