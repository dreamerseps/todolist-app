import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, vi } from 'vitest';
import ProfilePage from '../ProfilePage';
import { useGetProfile } from '@/features/profile/hooks/useGetProfile';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';
import { useChangePassword } from '@/features/profile/hooks/useChangePassword';

vi.mock('@/features/profile/hooks/useGetProfile', () => ({ useGetProfile: vi.fn() }));
vi.mock('@/features/profile/hooks/useUpdateProfile', () => ({ useUpdateProfile: vi.fn() }));
vi.mock('@/features/profile/hooks/useChangePassword', () => ({ useChangePassword: vi.fn() }));
vi.mock('@/components/Header/Header', () => ({ default: () => <header>Header</header> }));

const mockMutate = vi.fn();
const mockMutation = { mutate: mockMutate, isPending: false };

const mockProfile = {
  id: 'u1', email: 'test@example.com', name: '홍길동',
  created_at: '2026-05-14T00:00:00Z', updated_at: '2026-05-14T00:00:00Z',
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(useUpdateProfile).mockReturnValue(mockMutation as ReturnType<typeof useUpdateProfile>);
  vi.mocked(useChangePassword).mockReturnValue(mockMutation as ReturnType<typeof useChangePassword>);
});

afterEach(() => vi.clearAllMocks());

describe('ProfilePage 렌더링', () => {
  it('로딩 중 Spinner 표시', () => {
    vi.mocked(useGetProfile).mockReturnValue({ data: undefined, isLoading: true } as ReturnType<typeof useGetProfile>);
    renderPage();
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('페이지 제목 표시', () => {
    vi.mocked(useGetProfile).mockReturnValue({ data: mockProfile, isLoading: false } as ReturnType<typeof useGetProfile>);
    renderPage();
    expect(screen.getByRole('heading', { name: '프로필' })).toBeInTheDocument();
  });

  it('이메일 필드 disabled 처리', () => {
    vi.mocked(useGetProfile).mockReturnValue({ data: mockProfile, isLoading: false } as ReturnType<typeof useGetProfile>);
    renderPage();
    expect(screen.getByDisplayValue('test@example.com')).toBeDisabled();
  });

  it('"(변경 불가)" 텍스트 표시', () => {
    vi.mocked(useGetProfile).mockReturnValue({ data: mockProfile, isLoading: false } as ReturnType<typeof useGetProfile>);
    renderPage();
    expect(screen.getByText('(변경 불가)')).toBeInTheDocument();
  });

  it('이름 필드에 기존 이름 pre-fill', () => {
    vi.mocked(useGetProfile).mockReturnValue({ data: mockProfile, isLoading: false } as ReturnType<typeof useGetProfile>);
    renderPage();
    expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument();
  });

  it('비밀번호 변경 섹션 렌더링', () => {
    vi.mocked(useGetProfile).mockReturnValue({ data: mockProfile, isLoading: false } as ReturnType<typeof useGetProfile>);
    renderPage();
    expect(screen.getByRole('heading', { name: '비밀번호 변경' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('현재 비밀번호 입력')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('8자 이상 입력')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('새 비밀번호 재입력')).toBeInTheDocument();
  });
});

describe('ProfilePage 이름 수정', () => {
  beforeEach(() => {
    vi.mocked(useGetProfile).mockReturnValue({ data: mockProfile, isLoading: false } as ReturnType<typeof useGetProfile>);
  });

  it('이름 저장 버튼 클릭 시 updateProfile.mutate 호출', async () => {
    const updateMutate = vi.fn();
    vi.mocked(useUpdateProfile).mockReturnValue({ ...mockMutation, mutate: updateMutate } as ReturnType<typeof useUpdateProfile>);
    renderPage();
    const nameInput = screen.getByDisplayValue('홍길동');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, '새이름');
    await userEvent.click(screen.getByRole('button', { name: '이름 저장' }));
    expect(updateMutate).toHaveBeenCalledWith('새이름');
  });
});

describe('ProfilePage 비밀번호 변경 유효성', () => {
  beforeEach(() => {
    vi.mocked(useGetProfile).mockReturnValue({ data: mockProfile, isLoading: false } as ReturnType<typeof useGetProfile>);
  });

  it('현재 비밀번호 없이 제출 시 에러', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    expect(screen.getByText('현재 비밀번호를 입력해주세요.')).toBeInTheDocument();
  });

  it('새 비밀번호 8자 미만 시 에러', async () => {
    renderPage();
    await userEvent.type(screen.getByPlaceholderText('현재 비밀번호 입력'), 'oldpass');
    await userEvent.type(screen.getByPlaceholderText('8자 이상 입력'), 'short');
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    expect(screen.getByText(/8자 이상/)).toBeInTheDocument();
  });

  it('새 비밀번호 불일치 시 에러', async () => {
    renderPage();
    await userEvent.type(screen.getByPlaceholderText('현재 비밀번호 입력'), 'oldpass123');
    await userEvent.type(screen.getByPlaceholderText('8자 이상 입력'), 'newpass123');
    await userEvent.type(screen.getByPlaceholderText('새 비밀번호 재입력'), 'different1');
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
  });

  it('유효성 통과 시 changePassword.mutate 호출', async () => {
    const pwMutate = vi.fn();
    vi.mocked(useChangePassword).mockReturnValue({ ...mockMutation, mutate: pwMutate } as ReturnType<typeof useChangePassword>);
    renderPage();
    await userEvent.type(screen.getByPlaceholderText('현재 비밀번호 입력'), 'oldpass123');
    await userEvent.type(screen.getByPlaceholderText('8자 이상 입력'), 'newpass123');
    await userEvent.type(screen.getByPlaceholderText('새 비밀번호 재입력'), 'newpass123');
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    expect(pwMutate).toHaveBeenCalledWith(
      { current_password: 'oldpass123', new_password: 'newpass123' },
      expect.any(Object),
    );
  });
});
