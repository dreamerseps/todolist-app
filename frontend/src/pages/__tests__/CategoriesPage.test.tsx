import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, vi } from 'vitest';
import CategoriesPage from '../CategoriesPage';
import { useFetchCategories } from '@/features/categories/hooks/useFetchCategories';
import { useAddCategory } from '@/features/categories/hooks/useAddCategory';
import { useUpdateCategory } from '@/features/categories/hooks/useUpdateCategory';
import { useDeleteCategory } from '@/features/categories/hooks/useDeleteCategory';

vi.mock('@/features/categories/hooks/useFetchCategories', () => ({ useFetchCategories: vi.fn() }));
vi.mock('@/features/categories/hooks/useAddCategory', () => ({ useAddCategory: vi.fn() }));
vi.mock('@/features/categories/hooks/useUpdateCategory', () => ({ useUpdateCategory: vi.fn() }));
vi.mock('@/features/categories/hooks/useDeleteCategory', () => ({ useDeleteCategory: vi.fn() }));
vi.mock('@/components/Header/Header', () => ({ default: () => <header>Header</header> }));

const mockMutate = vi.fn();
const mockMutation = { mutate: mockMutate, isPending: false };

const mockCategories = [
  { id: 'c0', user_id: null, name: '업무', is_default: true },
  { id: 'c1', user_id: 'u1', name: '개인', is_default: false },
];

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(useAddCategory).mockReturnValue(mockMutation as ReturnType<typeof useAddCategory>);
  vi.mocked(useUpdateCategory).mockReturnValue(mockMutation as ReturnType<typeof useUpdateCategory>);
  vi.mocked(useDeleteCategory).mockReturnValue(mockMutation as ReturnType<typeof useDeleteCategory>);
});

afterEach(() => {
  vi.clearAllMocks();
});

test('페이지 제목 렌더링', () => {
  vi.mocked(useFetchCategories).mockReturnValue({ data: [], isLoading: false, isError: false } as ReturnType<typeof useFetchCategories>);
  renderPage();
  expect(screen.getByRole('heading', { name: '카테고리 관리' })).toBeInTheDocument();
});

test('로딩 중 Spinner 표시', () => {
  vi.mocked(useFetchCategories).mockReturnValue({ data: undefined, isLoading: true, isError: false } as ReturnType<typeof useFetchCategories>);
  renderPage();
  expect(document.querySelector('.spinner')).toBeInTheDocument();
});

test('에러 메시지 표시', () => {
  vi.mocked(useFetchCategories).mockReturnValue({ data: undefined, isLoading: false, isError: true } as ReturnType<typeof useFetchCategories>);
  renderPage();
  expect(screen.getByText('카테고리 목록을 불러오는데 실패했습니다.')).toBeInTheDocument();
});

test('카테고리 목록 렌더링', () => {
  vi.mocked(useFetchCategories).mockReturnValue({ data: mockCategories, isLoading: false, isError: false } as ReturnType<typeof useFetchCategories>);
  renderPage();
  expect(screen.getByText('업무')).toBeInTheDocument();
  expect(screen.getByText('개인')).toBeInTheDocument();
});

test('빈 목록 메시지 표시', () => {
  vi.mocked(useFetchCategories).mockReturnValue({ data: [], isLoading: false, isError: false } as ReturnType<typeof useFetchCategories>);
  renderPage();
  expect(screen.getByText('등록된 카테고리가 없습니다.')).toBeInTheDocument();
});

test('+ 카테고리 추가 버튼 클릭 시 추가 Modal 표시', async () => {
  vi.mocked(useFetchCategories).mockReturnValue({ data: [], isLoading: false, isError: false } as ReturnType<typeof useFetchCategories>);
  renderPage();
  await userEvent.click(screen.getByRole('button', { name: '+ 카테고리 추가' }));
  expect(screen.getByText('카테고리 추가')).toBeInTheDocument();
});

test('추가 Modal 취소 시 Modal 닫힘', async () => {
  vi.mocked(useFetchCategories).mockReturnValue({ data: [], isLoading: false, isError: false } as ReturnType<typeof useFetchCategories>);
  renderPage();
  await userEvent.click(screen.getByRole('button', { name: '+ 카테고리 추가' }));
  await userEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(screen.queryByText('카테고리 추가')).not.toBeInTheDocument();
});

test('이름 없이 추가 시 유효성 에러', async () => {
  vi.mocked(useFetchCategories).mockReturnValue({ data: [], isLoading: false, isError: false } as ReturnType<typeof useFetchCategories>);
  renderPage();
  await userEvent.click(screen.getByRole('button', { name: '+ 카테고리 추가' }));
  await userEvent.click(screen.getByRole('button', { name: '추가' }));
  expect(screen.getByText('카테고리 이름을 입력해주세요.')).toBeInTheDocument();
});

test('카테고리 추가 mutate 호출', async () => {
  const addMutate = vi.fn();
  vi.mocked(useAddCategory).mockReturnValue({ ...mockMutation, mutate: addMutate } as ReturnType<typeof useAddCategory>);
  vi.mocked(useFetchCategories).mockReturnValue({ data: [], isLoading: false, isError: false } as ReturnType<typeof useFetchCategories>);
  renderPage();
  await userEvent.click(screen.getByRole('button', { name: '+ 카테고리 추가' }));
  await userEvent.type(screen.getByPlaceholderText('카테고리 이름 입력'), '새 카테고리');
  await userEvent.click(screen.getByRole('button', { name: '추가' }));
  expect(addMutate).toHaveBeenCalledWith(
    { name: '새 카테고리' },
    expect.any(Object),
  );
});
