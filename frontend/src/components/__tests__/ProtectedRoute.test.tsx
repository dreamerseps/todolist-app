import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

const mockUser: User = {
  id: 'u1',
  email: 'test@example.com',
  name: '홍길동',
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

function renderWithRouter(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/todos"
          element={
            <ProtectedRoute>
              <div>Protected Todos</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <div>Protected Categories</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.getState().clearAuth();
});

describe('ProtectedRoute — 미인증', () => {
  it('/todos 접근 시 /login으로 리다이렉트된다', () => {
    renderWithRouter('/todos');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Todos')).not.toBeInTheDocument();
  });

  it('/categories 접근 시 /login으로 리다이렉트된다', () => {
    renderWithRouter('/categories');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Categories')).not.toBeInTheDocument();
  });
});

describe('ProtectedRoute — 인증 후', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth('access-token', 'refresh-token', mockUser);
  });

  it('인증 상태에서 /todos 접근 시 콘텐츠가 렌더된다', () => {
    renderWithRouter('/todos');
    expect(screen.getByText('Protected Todos')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('인증 상태에서 /categories 접근 시 콘텐츠가 렌더된다', () => {
    renderWithRouter('/categories');
    expect(screen.getByText('Protected Categories')).toBeInTheDocument();
  });
});

describe('ProtectedRoute — 로그아웃 후', () => {
  it('로그인 → 로그아웃 후 보호 경로 접근 시 /login으로 이동한다', () => {
    useAuthStore.getState().setAuth('access-token', 'refresh-token', mockUser);
    const { rerender } = renderWithRouter('/todos');
    expect(screen.getByText('Protected Todos')).toBeInTheDocument();

    useAuthStore.getState().clearAuth();
    rerender(
      <MemoryRouter initialEntries={['/todos']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/todos"
            element={
              <ProtectedRoute>
                <div>Protected Todos</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
