import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import React from 'react';
import apiClient from '@/api/client';
import { useGetProfile } from '../useGetProfile';

const mock = new AxiosMockAdapter(apiClient);

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

afterEach(() => mock.reset());

const mockUser = {
  id: 'u1', email: 'test@example.com', name: '홍길동',
  created_at: '2026-05-14T00:00:00Z', updated_at: '2026-05-14T00:00:00Z',
};

test('성공 시 user 데이터 반환', async () => {
  mock.onGet('/users/me').reply(200, { success: true, code: 'OK', data: mockUser });

  const { result } = renderHook(() => useGetProfile(), { wrapper: createWrapper() });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data?.name).toBe('홍길동');
  expect(result.current.data?.email).toBe('test@example.com');
});

test('초기 isLoading 상태', () => {
  mock.onGet('/users/me').reply(200, { success: true, code: 'OK', data: mockUser });

  const { result } = renderHook(() => useGetProfile(), { wrapper: createWrapper() });

  expect(result.current.isLoading).toBe(true);
});

test('API 오류 시 isError 상태', async () => {
  mock.onGet('/users/me').reply(500);

  const { result } = renderHook(() => useGetProfile(), { wrapper: createWrapper() });

  await waitFor(() => expect(result.current.isError).toBe(true));
});
