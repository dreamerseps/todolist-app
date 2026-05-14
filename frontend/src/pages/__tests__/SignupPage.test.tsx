import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, vi } from 'vitest';
import apiClient from '@/api/client';
import SignupPage from '../SignupPage';

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
        <SignupPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  mock.reset();
  mockNavigate.mockReset();
});

const mockUser = { id: '1', email: 'a@b.com', name: 'Test', created_at: '', updated_at: '' };

test('회원가입 페이지 렌더링', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument();
  expect(screen.getByLabelText('이름')).toBeInTheDocument();
  expect(screen.getByLabelText('이메일')).toBeInTheDocument();
  expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();
});

test('로그인 링크 존재', () => {
  renderPage();
  expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument();
});

test('이름 빈 값 제출 시 유효성 오류', async () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
  expect(await screen.findByText('이름을 입력해주세요.')).toBeInTheDocument();
});

test('잘못된 이메일 형식 제출 시 유효성 오류', async () => {
  renderPage();
  await userEvent.type(screen.getByLabelText('이름'), 'Test');
  await userEvent.type(screen.getByLabelText('이메일'), 'invalid');
  fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
  expect(await screen.findByText('올바른 이메일 형식을 입력해주세요.')).toBeInTheDocument();
});

test('비밀번호 8자 미만 제출 시 유효성 오류', async () => {
  renderPage();
  await userEvent.type(screen.getByLabelText('이름'), 'Test');
  await userEvent.type(screen.getByLabelText('이메일'), 'a@b.com');
  await userEvent.type(screen.getByLabelText('비밀번호'), '1234567');
  fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
  expect(await screen.findByText('비밀번호는 8자 이상이어야 합니다.')).toBeInTheDocument();
});

test('비밀번호 불일치 시 유효성 오류', async () => {
  renderPage();
  await userEvent.type(screen.getByLabelText('이름'), 'Test');
  await userEvent.type(screen.getByLabelText('이메일'), 'a@b.com');
  await userEvent.type(screen.getByLabelText('비밀번호'), 'password1');
  await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'password2');
  fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
  expect(await screen.findByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
});

test('회원가입 성공 시 /login으로 이동', async () => {
  mock.onPost('/auth/register').reply(201, { success: true, code: 'CREATED', data: mockUser });
  renderPage();

  await userEvent.type(screen.getByLabelText('이름'), 'Test');
  await userEvent.type(screen.getByLabelText('이메일'), 'a@b.com');
  await userEvent.type(screen.getByLabelText('비밀번호'), 'password1');
  await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'password1');
  fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
});

test('409 에러 시 이메일 Input에 에러 메시지 표시', async () => {
  mock.onPost('/auth/register').reply(409, { success: false, code: 'CONFLICT' });
  renderPage();

  await userEvent.type(screen.getByLabelText('이름'), 'Test');
  await userEvent.type(screen.getByLabelText('이메일'), 'a@b.com');
  await userEvent.type(screen.getByLabelText('비밀번호'), 'password1');
  await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'password1');
  fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

  expect(await screen.findByText('이미 사용 중인 이메일입니다.')).toBeInTheDocument();
});

test('그 외 에러 시 일반 에러 메시지 표시', async () => {
  mock.onPost('/auth/register').reply(500);
  renderPage();

  await userEvent.type(screen.getByLabelText('이름'), 'Test');
  await userEvent.type(screen.getByLabelText('이메일'), 'a@b.com');
  await userEvent.type(screen.getByLabelText('비밀번호'), 'password1');
  await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'password1');
  fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

  expect(await screen.findByText('회원가입에 실패했습니다.')).toBeInTheDocument();
});
