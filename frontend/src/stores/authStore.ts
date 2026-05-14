import { create } from 'zustand';
import type { User } from '@/types';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  setAuth: (accessToken, refreshToken, user) =>
    set({ accessToken, refreshToken, user, isAuthenticated: true }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  clearAuth: () =>
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
}));
