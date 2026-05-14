import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import type { User } from '@/types';

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: '홍길동',
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

beforeEach(() => {
  useAuthStore.getState().clearAuth();
});

describe('authStore - 초기 상태', () => {
  it('accessToken이 null이어야 한다', () => {
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('refreshToken이 null이어야 한다', () => {
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  it('user가 null이어야 한다', () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('isAuthenticated가 false이어야 한다', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('authStore - setAuth', () => {
  it('accessToken, refreshToken, user를 설정한다', () => {
    useAuthStore.getState().setAuth('access-token', 'refresh-token', mockUser);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access-token');
    expect(state.refreshToken).toBe('refresh-token');
    expect(state.user).toEqual(mockUser);
  });

  it('setAuth 후 isAuthenticated가 true가 된다', () => {
    useAuthStore.getState().setAuth('access-token', 'refresh-token', mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('user 정보가 정확히 저장된다', () => {
    useAuthStore.getState().setAuth('access-token', 'refresh-token', mockUser);
    const { user } = useAuthStore.getState();
    expect(user?.email).toBe('test@example.com');
    expect(user?.name).toBe('홍길동');
  });
});

describe('authStore - setAccessToken', () => {
  it('accessToken만 갱신한다', () => {
    useAuthStore.getState().setAuth('old-token', 'refresh-token', mockUser);
    useAuthStore.getState().setAccessToken('new-token');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-token');
    expect(state.refreshToken).toBe('refresh-token');
    expect(state.user).toEqual(mockUser);
  });

  it('setAccessToken은 refreshToken과 user를 변경하지 않는다', () => {
    useAuthStore.getState().setAuth('access-token', 'refresh-token', mockUser);
    useAuthStore.getState().setAccessToken('new-access-token');

    expect(useAuthStore.getState().refreshToken).toBe('refresh-token');
    expect(useAuthStore.getState().user?.id).toBe('user-1');
  });
});

describe('authStore - clearAuth', () => {
  it('모든 인증 상태를 초기화한다', () => {
    useAuthStore.getState().setAuth('access-token', 'refresh-token', mockUser);
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('로그인 전 clearAuth 호출해도 오류가 없다', () => {
    expect(() => useAuthStore.getState().clearAuth()).not.toThrow();
  });
});

describe('authStore - isAuthenticated 상태 전이', () => {
  it('로그인 → 로그아웃 시 isAuthenticated가 false로 전환된다', () => {
    useAuthStore.getState().setAuth('access-token', 'refresh-token', mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('여러 번 setAuth 호출 시에도 isAuthenticated가 true를 유지한다', () => {
    useAuthStore.getState().setAuth('token-1', 'refresh-1', mockUser);
    useAuthStore.getState().setAuth('token-2', 'refresh-2', mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
