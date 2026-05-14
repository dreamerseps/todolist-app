import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import React from 'react';
import apiClient from '@/api/client';
import { useChangePassword } from '../useChangePassword';
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

const mockUser = {
  id: 'u1', email: 'test@example.com', name: '홍길동',
  created_at: '2026-05-14T00:00:00Z', updated_at: '2026-05-14T00:00:00Z',
};

test('성공 시 success 토스트 표시', async () => {
  mock.onPatch('/users/me').reply(200, { success: true, code: 'OK', data: mockUser });

  const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() });

  act(() => {
    result.current.mutate({ current_password: 'oldpass123', new_password: 'newpass123' });
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(useUiStore.getState().toasts.some((t) => t.type === 'success')).toBe(true);
});

test('401 에러 시 "현재 비밀번호가 올바르지 않습니다" 토스트', async () => {
  mock.onPatch('/users/me').reply(401, { success: false, code: 'UNAUTHORIZED' });

  const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() });

  act(() => {
    result.current.mutate({ current_password: 'wrongpass', new_password: 'newpass123' });
  });

  await waitFor(() => expect(result.current.isError).toBe(true));

  const toasts = useUiStore.getState().toasts;
  expect(toasts.some((t) => t.message.includes('현재 비밀번호가 올바르지 않습니다'))).toBe(true);
});

test('401 외 에러 시 일반 에러 토스트', async () => {
  mock.onPatch('/users/me').reply(500);

  const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() });

  act(() => {
    result.current.mutate({ current_password: 'pass', new_password: 'newpass' });
  });

  await waitFor(() => expect(result.current.isError).toBe(true));

  const toasts = useUiStore.getState().toasts;
  expect(toasts.some((t) => t.message === '비밀번호 변경에 실패했습니다.')).toBe(true);
});
