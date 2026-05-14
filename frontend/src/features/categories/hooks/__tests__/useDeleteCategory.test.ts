import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import React from 'react';
import apiClient from '@/api/client';
import { useDeleteCategory } from '../useDeleteCategory';
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
  mock.onDelete('/categories/c1').reply(200, { success: true, code: 'OK' });

  const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() });

  act(() => { result.current.mutate('c1'); });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(useUiStore.getState().toasts.some((t) => t.type === 'success')).toBe(true);
});

test('422 에러 시 "할일이 속한 카테고리" 토스트 표시', async () => {
  mock.onDelete('/categories/c1').reply(422, { success: false, code: 'UNPROCESSABLE_ENTITY' });

  const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() });

  act(() => { result.current.mutate('c1'); });

  await waitFor(() => expect(result.current.isError).toBe(true));

  const toasts = useUiStore.getState().toasts;
  expect(toasts.some((t) => t.message.includes('할일이 속한 카테고리'))).toBe(true);
});

test('422 외 에러 시 일반 에러 토스트 표시', async () => {
  mock.onDelete('/categories/c1').reply(500);

  const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() });

  act(() => { result.current.mutate('c1'); });

  await waitFor(() => expect(result.current.isError).toBe(true));

  const toasts = useUiStore.getState().toasts;
  expect(toasts.some((t) => t.message === '카테고리 삭제에 실패했습니다.')).toBe(true);
});
