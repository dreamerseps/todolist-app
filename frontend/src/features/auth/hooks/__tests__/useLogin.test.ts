import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, vi } from 'vitest';
import React from 'react';
import apiClient from '@/api/client';
import { useLogin } from '../useLogin';
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
  useAuthStore.getState().clearAuth();
});

const mockUser = { id: '1', email: 'a@b.com', name: 'Test', created_at: '', updated_at: '' };
const mockResponse = {
  success: true,
  code: 'OK',
  data: { accessToken: 'acc', refreshToken: 'ref', user: mockUser },
};

test('성공 시 setAuth 호출 후 /todos로 이동', async () => {
  mock.onPost('/auth/login').reply(200, mockResponse);

  const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

  await act(async () => {
    result.current.mutate({ email: 'a@b.com', password: '1234' });
  });

  expect(useAuthStore.getState().isAuthenticated).toBe(true);
  expect(useAuthStore.getState().accessToken).toBe('acc');
  expect(mockNavigate).toHaveBeenCalledWith('/todos');
});

test('실패 시 에러 상태 설정', async () => {
  mock.onPost('/auth/login').reply(401, { success: false, code: 'UNAUTHORIZED' });

  const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

  await act(async () => {
    result.current.mutate({ email: 'a@b.com', password: 'wrong' });
  });

  expect(result.current.isError).toBe(true);
  expect(mockNavigate).not.toHaveBeenCalled();
});
