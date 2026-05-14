import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, vi } from 'vitest';
import React from 'react';
import apiClient from '@/api/client';
import { useSignup } from '../useSignup';

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

test('성공 시 /login으로 이동', async () => {
  mock.onPost('/auth/register').reply(201, { success: true, code: 'CREATED', data: mockUser });

  const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });

  await act(async () => {
    result.current.mutate({ email: 'a@b.com', password: 'password1', name: 'Test' });
  });

  expect(mockNavigate).toHaveBeenCalledWith('/login');
});

test('실패 시 에러 상태 설정', async () => {
  mock.onPost('/auth/register').reply(409, { success: false, code: 'CONFLICT' });

  const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });

  await act(async () => {
    result.current.mutate({ email: 'a@b.com', password: 'password1', name: 'Test' });
  });

  expect(result.current.isError).toBe(true);
  expect(mockNavigate).not.toHaveBeenCalled();
});
