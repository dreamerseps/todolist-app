import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';
import { useAuthStore } from '@/stores/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const testUser = {
  id: '1',
  email: 'test@example.com',
  name: '홍길동',
  created_at: '',
  updated_at: '',
};

describe('Header', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: testUser,
      accessToken: 'token',
      refreshToken: 'refresh',
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    mockNavigate.mockReset();
  });

  it('로고 텍스트 렌더링', () => {
    render(<MemoryRouter><Header /></MemoryRouter>);
    expect(screen.getByText(/TodoList/)).toBeInTheDocument();
  });

  it('할일 목록 링크 렌더링', () => {
    render(<MemoryRouter><Header /></MemoryRouter>);
    expect(screen.getByText('할일 목록')).toBeInTheDocument();
  });

  it('카테고리 링크 렌더링', () => {
    render(<MemoryRouter><Header /></MemoryRouter>);
    expect(screen.getByText('카테고리')).toBeInTheDocument();
  });

  it('사용자명 표시', () => {
    render(<MemoryRouter><Header /></MemoryRouter>);
    expect(screen.getByText('홍길동')).toBeInTheDocument();
  });

  it('사용자 버튼 클릭 시 드롭다운 열림', async () => {
    render(<MemoryRouter><Header /></MemoryRouter>);
    await userEvent.click(screen.getByText('홍길동'));
    expect(screen.getByText('프로필 수정')).toBeInTheDocument();
    expect(screen.getByText('로그아웃')).toBeInTheDocument();
  });

  it('로그아웃 클릭 시 clearAuth 호출 후 /login 이동', async () => {
    render(<MemoryRouter><Header /></MemoryRouter>);
    await userEvent.click(screen.getByText('홍길동'));
    await userEvent.click(screen.getByText('로그아웃'));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
