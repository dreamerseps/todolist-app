import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditTodoModal from '../EditTodoModal';
import type { Category, TodoItem } from '@/types';

const categories: Category[] = [
  { id: 'c1', user_id: null, name: '업무', is_default: true },
  { id: 'c2', user_id: 'u1', name: '개인', is_default: false },
];

const mockTodo: TodoItem = {
  id: '1',
  user_id: 'u1',
  category_id: 'c1',
  title: '기존 할일',
  description: '기존 설명',
  due_date: '2026-05-20',
  is_completed: false,
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

function renderModal(onConfirm = vi.fn(), onCancel = vi.fn()) {
  return render(
    <EditTodoModal
      todo={mockTodo}
      categories={categories}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
}

describe('EditTodoModal 렌더링', () => {
  it('모달 제목 표시', () => {
    renderModal();
    expect(screen.getByText('할일 수정')).toBeInTheDocument();
  });

  it('기존 제목이 pre-fill됨', () => {
    renderModal();
    expect(screen.getByDisplayValue('기존 할일')).toBeInTheDocument();
  });

  it('기존 설명이 pre-fill됨', () => {
    renderModal();
    expect(screen.getByDisplayValue('기존 설명')).toBeInTheDocument();
  });

  it('기존 카테고리가 pre-fill됨', () => {
    renderModal();
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('c1');
  });

  it('기존 마감일이 pre-fill됨', () => {
    renderModal();
    expect(screen.getByDisplayValue('2026-05-20T00:00')).toBeInTheDocument();
  });

  it('저장 버튼 렌더링', () => {
    renderModal();
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });
});

describe('EditTodoModal 유효성 검사', () => {
  it('제목 지우고 저장 시 에러 표시', async () => {
    renderModal();
    const titleInput = screen.getByDisplayValue('기존 할일');
    await userEvent.clear(titleInput);
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument();
  });

  it('유효성 실패 시 onConfirm 미호출', async () => {
    const onConfirm = vi.fn();
    render(<EditTodoModal todo={mockTodo} categories={categories} onConfirm={onConfirm} onCancel={vi.fn()} />);
    const titleInput = screen.getByDisplayValue('기존 할일');
    await userEvent.clear(titleInput);
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe('EditTodoModal 성공 제출', () => {
  it('수정 후 onConfirm 호출', async () => {
    const onConfirm = vi.fn();
    render(<EditTodoModal todo={mockTodo} categories={categories} onConfirm={onConfirm} onCancel={vi.fn()} />);

    const titleInput = screen.getByDisplayValue('기존 할일');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, '수정된 할일');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: '수정된 할일' }),
    );
  });

  it('onCancel 호출', async () => {
    const onCancel = vi.fn();
    render(<EditTodoModal todo={mockTodo} categories={categories} onConfirm={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('null description이 있는 todo도 pre-fill 없이 렌더링', () => {
    const todoWithNull: TodoItem = { ...mockTodo, description: null, due_date: null };
    render(<EditTodoModal todo={todoWithNull} categories={categories} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByPlaceholderText('설명 입력')).toHaveValue('');
  });
});
