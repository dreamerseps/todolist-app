import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import React from 'react';
import apiClient from '@/api/client';
import { useUpdateProfile } from '../useUpdateProfile';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

const mock = new AxiosMockAdapter(apiClient);

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const mockUser = {
  id: 'u1', email: 'test@example.com', name: '홍길동',
  created_at: '2026-05-14T00:00:00Z', updated_at: '2026-05-14T00:00:00Z',
};

beforeEach(() => {
  useAuthStore.getState().setAuth('token', 'refresh', mockUser);
});

afterEach(() => {
  mock.reset();
  useAuthStore.getState().clearAuth();
  useUiStore.getState().toasts.forEach((t) => useUiStore.getState().removeToast(t.id));
});

test('성공 시 authStore user.name 업데이트', async () => {
  const updatedUser = { ...mockUser, name: '수정된 이름' };
  mock.onPatch('/users/me').reply(200, { success: true, code: 'OK', data: updatedUser });

  const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

  act(() => { result.current.mutate('수정된 이름'); });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(useAuthStore.getState().user?.name).toBe('수정된 이름');
});

test('성공 시 success 토스트 표시', async () => {
  const updatedUser = { ...mockUser, name: '수정된 이름' };
  mock.onPatch('/users/me').reply(200, { success: true, code: 'OK', data: updatedUser });

  const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

  act(() => { result.current.mutate('수정된 이름'); });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(useUiStore.getState().toasts.some((t) => t.type === 'success')).toBe(true);
});

test('실패 시 error 토스트 표시', async () => {
  mock.onPatch('/users/me').reply(400);

  const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

  act(() => { result.current.mutate('실패'); });

  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(useUiStore.getState().toasts.some((t) => t.type === 'error')).toBe(true);
});
