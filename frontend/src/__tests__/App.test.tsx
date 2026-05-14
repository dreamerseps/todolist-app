import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import TodosPage from '@/pages/TodosPage';
import CategoriesPage from '@/pages/CategoriesPage';
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { ROUTES } from '@/constants';
import type { User } from '@/types';

const mockUser: User = {
  id: 'u1',
  email: 'test@example.com',
  name: '홍길동',
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
      <Route
        path={ROUTES.TODOS}
        element={
          <ProtectedRoute>
            <TodosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CATEGORIES}
        element={
          <ProtectedRoute>
            <CategoriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={ROUTES.TODOS} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function renderRoutes(initialEntry: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.getState().clearAuth();
});

describe('공개 경로', () => {
  it('/login → 로그인 페이지', () => {
    renderRoutes('/login');
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('/signup → 회원가입 페이지', () => {
    renderRoutes('/signup');
    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();
  });

  it('알 수 없는 경로 → 404 페이지', () => {
    renderRoutes('/unknown-path');
    expect(screen.getByText(/404/)).toBeInTheDocument();
  });
});

describe('보호 경로 — 미인증', () => {
  it('/ 접근 시 /login으로 리다이렉트', () => {
    renderRoutes('/');
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('/todos 미인증 → /login 리다이렉트', () => {
    renderRoutes('/todos');
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('/categories 미인증 → /login 리다이렉트', () => {
    renderRoutes('/categories');
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('/profile 미인증 → /login 리다이렉트', () => {
    renderRoutes('/profile');
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });
});

describe('보호 경로 — 인증 후', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth('access-token', 'refresh-token', mockUser);
  });

  it('/todos 인증 후 → 투두 페이지', () => {
    renderRoutes('/todos');
    expect(screen.getByRole('heading', { name: '할일 목록' })).toBeInTheDocument();
  });

  it('/categories 인증 후 → 카테고리 페이지', () => {
    renderRoutes('/categories');
    expect(screen.getByRole('heading', { name: '카테고리 관리' })).toBeInTheDocument();
  });

  it('/profile 인증 후 → 프로필 페이지', () => {
    renderRoutes('/profile');
    expect(screen.getByRole('heading', { name: '프로필' })).toBeInTheDocument();
  });

  it('/ 인증 후 → /todos로 리다이렉트', () => {
    renderRoutes('/');
    expect(screen.getByRole('heading', { name: '할일 목록' })).toBeInTheDocument();
  });
});
