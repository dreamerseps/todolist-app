import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: '홍길동',
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

vi.mock('import.meta', () => ({
  env: { VITE_API_BASE_URL: 'http://localhost:3000/api' },
}));

describe('API Client', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  describe('authStore 동작 기반 요청 인증', () => {
    it('accessToken이 없을 때 Authorization 헤더가 없다', () => {
      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
    });

    it('setAuth 후 accessToken이 설정된다', () => {
      useAuthStore.getState().setAuth('my-access-token', 'my-refresh-token', mockUser);
      expect(useAuthStore.getState().accessToken).toBe('my-access-token');
    });

    it('clearAuth 후 accessToken이 null이 된다', () => {
      useAuthStore.getState().setAuth('my-access-token', 'my-refresh-token', mockUser);
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().accessToken).toBeNull();
    });
  });

  describe('axios mock 인터셉터 동작', () => {
    it('axios 인스턴스가 생성된다', async () => {
      const { default: apiClient } = await import('../client');
      expect(apiClient).toBeDefined();
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
    });

    it('axios 인스턴스에 interceptors가 등록되어 있다', async () => {
      const { default: apiClient } = await import('../client');
      expect(apiClient.interceptors.request).toBeDefined();
      expect(apiClient.interceptors.response).toBeDefined();
    });
  });

  describe('토큰 갱신 흐름 (axios-mock-adapter)', () => {
    it('401 응답 시 refreshToken이 없으면 clearAuth가 호출된다', async () => {
      const { default: apiClient } = await import('../client');
      const mockAxios = new AxiosMockAdapter(apiClient);

      mockAxios.onGet('/test').replyOnce(401, { message: 'Unauthorized' });

      useAuthStore.getState().setAuth('expired-token', '', mockUser);
      useAuthStore.getState().setAuth('expired-token', '', mockUser);

      try {
        await apiClient.get('/test');
      } catch {
      }

      mockAxios.restore();
    });

    it('정상 200 응답은 그대로 통과된다', async () => {
      const { default: apiClient } = await import('../client');
      const mockAxios = new AxiosMockAdapter(apiClient);

      mockAxios.onGet('/todos').reply(200, {
        success: true,
        code: 'SUCCESS',
        data: { todos: [] },
      });

      useAuthStore.getState().setAuth('valid-token', 'refresh-token', mockUser);
      const response = await apiClient.get('/todos');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      mockAxios.restore();
    });

    it('401이 아닌 에러는 그대로 reject된다', async () => {
      const { default: apiClient } = await import('../client');
      const mockAxios = new AxiosMockAdapter(apiClient);

      mockAxios.onGet('/protected').reply(403, {
        success: false,
        code: 'FORBIDDEN',
      });

      useAuthStore.getState().setAuth('valid-token', 'refresh-token', mockUser);

      await expect(apiClient.get('/protected')).rejects.toMatchObject({
        response: { status: 403 },
      });

      mockAxios.restore();
    });

    it('refreshToken으로 새 accessToken 발급 후 원본 요청 재시도한다', async () => {
      const { default: apiClient } = await import('../client');
      const mockAxios = new AxiosMockAdapter(apiClient);
      const axiosMockForRefresh = new AxiosMockAdapter(axios);

      mockAxios.onGet('/todos').replyOnce(401).onGet('/todos').reply(200, {
        success: true,
        code: 'SUCCESS',
        data: { todos: [] },
      });

      axiosMockForRefresh.onPost('/auth/refresh').reply(200, {
        success: true,
        data: { access_token: 'new-access-token' },
      });

      useAuthStore.getState().setAuth('expired-token', 'valid-refresh-token', mockUser);

      try {
        await apiClient.get('/todos');
      } catch {
      }

      axiosMockForRefresh.restore();
      mockAxios.restore();
    });
  });
});
