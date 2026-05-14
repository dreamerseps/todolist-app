import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, vi } from 'vitest';
import TodosPage from '../TodosPage';
import { useFetchTodos } from '@/features/todos/hooks/useFetchTodos';
import { useFetchCategories } from '@/features/categories/hooks/useFetchCategories';
import { useAddTodo } from '@/features/todos/hooks/useAddTodo';
import { useUpdateTodo } from '@/features/todos/hooks/useUpdateTodo';
import { useDeleteTodo } from '@/features/todos/hooks/useDeleteTodo';

vi.mock('@/features/todos/hooks/useFetchTodos', () => ({ useFetchTodos: vi.fn() }));
vi.mock('@/features/categories/hooks/useFetchCategories', () => ({ useFetchCategories: vi.fn() }));
vi.mock('@/features/todos/hooks/useAddTodo', () => ({ useAddTodo: vi.fn() }));
vi.mock('@/features/todos/hooks/useUpdateTodo', () => ({ useUpdateTodo: vi.fn() }));
vi.mock('@/features/todos/hooks/useDeleteTodo', () => ({ useDeleteTodo: vi.fn() }));
vi.mock('@/components/Header/Header', () => ({ default: () => <header>Header</header> }));

const mockUseFetchTodos = vi.mocked(useFetchTodos);
const mockUseFetchCategories = vi.mocked(useFetchCategories);
const mockUseAddTodo = vi.mocked(useAddTodo);
const mockUseUpdateTodo = vi.mocked(useUpdateTodo);
const mockUseDeleteTodo = vi.mocked(useDeleteTodo);

const mockMutate = vi.fn();
const mockMutation = { mutate: mockMutate, isPending: false, isSuccess: false, isError: false };

const mockTodo = {
  id: '1', user_id: 'u1', category_id: 'c1', title: '테스트 할일',
  description: null, due_date: null, is_completed: false,
  created_at: '2026-05-14T00:00:00Z', updated_at: '2026-05-14T00:00:00Z',
};

const mockCategories = [{ id: 'c1', user_id: null, name: '업무', is_default: true }];

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TodosPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockUseFetchCategories.mockReturnValue({ data: mockCategories } as ReturnType<typeof useFetchCategories>);
  mockUseAddTodo.mockReturnValue(mockMutation as ReturnType<typeof useAddTodo>);
  mockUseUpdateTodo.mockReturnValue(mockMutation as ReturnType<typeof useUpdateTodo>);
  mockUseDeleteTodo.mockReturnValue(mockMutation as ReturnType<typeof useDeleteTodo>);
});

afterEach(() => {
  vi.clearAllMocks();
});

test('Spinner 로딩 상태 표시', () => {
  mockUseFetchTodos.mockReturnValue({ data: undefined, isLoading: true, isError: false } as ReturnType<typeof useFetchTodos>);
  renderPage();
  expect(document.querySelector('.spinner')).toBeInTheDocument();
});

test('빈 목록 "등록된 할일이 없습니다" 표시', () => {
  mockUseFetchTodos.mockReturnValue({
    data: { todos: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 1 } },
    isLoading: false, isError: false,
  } as ReturnType<typeof useFetchTodos>);
  renderPage();
  expect(screen.getByText('등록된 할일이 없습니다')).toBeInTheDocument();
});

test('todo 목록 렌더링', () => {
  mockUseFetchTodos.mockReturnValue({
    data: { todos: [mockTodo], pagination: { page: 1, limit: 20, total: 1, total_pages: 1 } },
    isLoading: false, isError: false,
  } as ReturnType<typeof useFetchTodos>);
  renderPage();
  expect(screen.getByText('테스트 할일')).toBeInTheDocument();
});

test('에러 메시지 표시', () => {
  mockUseFetchTodos.mockReturnValue({ data: undefined, isLoading: false, isError: true } as ReturnType<typeof useFetchTodos>);
  renderPage();
  expect(screen.getByText('할일 목록을 불러오는데 실패했습니다.')).toBeInTheDocument();
});

test('+ 할일 추가 버튼 클릭 시 AddTodoModal 표시', async () => {
  mockUseFetchTodos.mockReturnValue({ data: undefined, isLoading: true, isError: false } as ReturnType<typeof useFetchTodos>);
  renderPage();
  await userEvent.click(screen.getByRole('button', { name: '+ 할일 추가' }));
  expect(screen.getByText('할일 추가')).toBeInTheDocument();
});

test('AddTodoModal 취소 시 모달 닫힘', async () => {
  mockUseFetchTodos.mockReturnValue({ data: undefined, isLoading: true, isError: false } as ReturnType<typeof useFetchTodos>);
  renderPage();
  await userEvent.click(screen.getByRole('button', { name: '+ 할일 추가' }));
  await userEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(screen.queryByText('할일 추가')).not.toBeInTheDocument();
});

test('수정 버튼 클릭 시 EditTodoModal 표시', async () => {
  mockUseFetchTodos.mockReturnValue({
    data: { todos: [mockTodo], pagination: { page: 1, limit: 20, total: 1, total_pages: 1 } },
    isLoading: false, isError: false,
  } as ReturnType<typeof useFetchTodos>);
  renderPage();
  await userEvent.click(screen.getByRole('button', { name: '수정' }));
  expect(screen.getByText('할일 수정')).toBeInTheDocument();
});

test('삭제 버튼 클릭 시 삭제 확인 Modal 표시', async () => {
  mockUseFetchTodos.mockReturnValue({
    data: { todos: [mockTodo], pagination: { page: 1, limit: 20, total: 1, total_pages: 1 } },
    isLoading: false, isError: false,
  } as ReturnType<typeof useFetchTodos>);
  renderPage();
  await userEvent.click(screen.getByRole('button', { name: '삭제' }));
  expect(screen.getByText('할일 삭제')).toBeInTheDocument();
});

test('삭제 확인 시 deleteToduMutate 호출', async () => {
  const deleteMutate = vi.fn();
  mockUseDeleteTodo.mockReturnValue({ ...mockMutation, mutate: deleteMutate } as ReturnType<typeof useDeleteTodo>);
  mockUseFetchTodos.mockReturnValue({
    data: { todos: [mockTodo], pagination: { page: 1, limit: 20, total: 1, total_pages: 1 } },
    isLoading: false, isError: false,
  } as ReturnType<typeof useFetchTodos>);
  renderPage();
  await userEvent.click(screen.getByRole('button', { name: '삭제' }));
  await userEvent.click(screen.getByRole('button', { name: '확인' }));
  expect(deleteMutate).toHaveBeenCalledWith('1', expect.any(Object));
});

test('체크박스 클릭 시 useUpdateTodo 호출', async () => {
  const updateMutate = vi.fn();
  mockUseUpdateTodo.mockReturnValue({ ...mockMutation, mutate: updateMutate } as ReturnType<typeof useUpdateTodo>);
  mockUseFetchTodos.mockReturnValue({
    data: { todos: [mockTodo], pagination: { page: 1, limit: 20, total: 1, total_pages: 1 } },
    isLoading: false, isError: false,
  } as ReturnType<typeof useFetchTodos>);
  renderPage();
  const checkboxes = screen.getAllByRole('button', { name: '완료' });
  const todoCheckbox = checkboxes.find((btn) => btn.classList.contains('todo-checkbox'))!;
  await userEvent.click(todoCheckbox);
  expect(updateMutate).toHaveBeenCalledWith(
    expect.objectContaining({ id: '1', body: expect.objectContaining({ is_completed: true }) }),
  );
});
