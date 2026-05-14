import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, vi } from 'vitest';
import apiClient from '@/api/client';
import LoginPage from '../LoginPage';
import { useAuthStore } from '@/stores/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mock = new AxiosMockAdapter(apiClient);

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
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
  data: { access_token: 'acc', refresh_token: 'ref', user: mockUser },
};

test('로그인 페이지 렌더링', () => {
  renderPage();
  expect(screen.getByText('TodoList')).toBeInTheDocument();
  expect(screen.getByLabelText('이메일')).toBeInTheDocument();
  expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
});

test('회원가입 링크 존재', () => {
  renderPage();
  expect(screen.getByRole('link', { name: '회원가입' })).toBeInTheDocument();
});

test('이메일 빈 값 제출 시 유효성 오류', async () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));
  expect(await screen.findByText('올바른 이메일을 입력해주세요.')).toBeInTheDocument();
});

test('@ 없는 이메일 제출 시 유효성 오류', async () => {
  renderPage();
  await userEvent.type(screen.getByLabelText('이메일'), 'invalidemail');
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));
  expect(await screen.findByText('올바른 이메일을 입력해주세요.')).toBeInTheDocument();
});

test('비밀번호 빈 값 제출 시 유효성 오류', async () => {
  renderPage();
  await userEvent.type(screen.getByLabelText('이메일'), 'a@b.com');
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));
  expect(await screen.findByText('비밀번호를 입력해주세요.')).toBeInTheDocument();
});

test('로그인 성공 시 /todos 이동', async () => {
  mock.onPost('/auth/login').reply(200, mockResponse);
  renderPage();

  await userEvent.type(screen.getByLabelText('이메일'), 'a@b.com');
  await userEvent.type(screen.getByLabelText('비밀번호'), 'password');
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/todos'));
});

test('401 에러 시 인라인 에러 메시지 표시', async () => {
  mock.onPost('/auth/login').reply(401, { success: false, code: 'UNAUTHORIZED' });
  renderPage();

  await userEvent.type(screen.getByLabelText('이메일'), 'a@b.com');
  await userEvent.type(screen.getByLabelText('비밀번호'), 'wrong');
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));

  expect(
    await screen.findByText('이메일 또는 비밀번호가 일치하지 않습니다.')
  ).toBeInTheDocument();
});

test('그 외 에러 시 일반 에러 메시지 표시', async () => {
  mock.onPost('/auth/login').reply(500);
  renderPage();

  await userEvent.type(screen.getByLabelText('이메일'), 'a@b.com');
  await userEvent.type(screen.getByLabelText('비밀번호'), 'password');
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));

  expect(await screen.findByText('로그인에 실패했습니다.')).toBeInTheDocument();
});
