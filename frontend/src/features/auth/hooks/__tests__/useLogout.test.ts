import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, vi } from 'vitest';
import React from 'react';
import apiClient from '@/api/client';
import { useLogout } from '../useLogout';
import { useAuthStore } from '@/stores/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

const mock = new AxiosMockAdapter(apiClient);

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

afterEach(() => {
  mock.reset();
  mockNavigate.mockReset();
});

const mockUser = { id: '1', email: 'a@b.com', name: 'Test', created_at: '', updated_at: '' };

test('로그아웃 성공 시 clearAuth 호출 후 /login으로 이동', async () => {
  useAuthStore.getState().setAuth('acc', 'ref', mockUser);
  mock.onPost('/auth/logout').reply(200, { success: true, code: 'OK' });

  const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });

  await act(async () => {
    result.current.mutate();
  });

  expect(useAuthStore.getState().isAuthenticated).toBe(false);
  expect(mockNavigate).toHaveBeenCalledWith('/login');
});

test('로그아웃 실패해도 clearAuth + navigate 호출 (onSettled)', async () => {
  useAuthStore.getState().setAuth('acc', 'ref', mockUser);
  mock.onPost('/auth/logout').reply(500);

  const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });

  await act(async () => {
    result.current.mutate();
  });

  expect(useAuthStore.getState().isAuthenticated).toBe(false);
  expect(mockNavigate).toHaveBeenCalledWith('/login');
});
