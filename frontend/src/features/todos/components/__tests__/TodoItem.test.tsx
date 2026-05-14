import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import TodoItem from '../TodoItem';
import type { TodoItem as TodoItemType } from '@/types';

afterEach(() => {
  vi.clearAllMocks();
});

const baseTodo: TodoItemType = {
  id: '1',
  user_id: 'u1',
  category_id: 'c1',
  title: '테스트 할일',
  description: null,
  due_date: '2026-05-20',
  is_completed: false,
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
};

test('todo 정보(제목, 마감일) 렌더링', () => {
  render(<TodoItem todo={baseTodo} />);

  expect(screen.getByText('테스트 할일')).toBeInTheDocument();
  expect(screen.getByText('2026-05-20')).toBeInTheDocument();
});

test('완료 항목 취소선 스타일 클래스 적용', () => {
  const completedTodo = { ...baseTodo, is_completed: true };
  render(<TodoItem todo={completedTodo} />);

  const title = screen.getByText('테스트 할일');
  expect(title).toHaveClass('completed');
});

test('카테고리 배지 렌더링', () => {
  render(<TodoItem todo={baseTodo} categoryName="업무" categoryIndex={0} />);

  expect(screen.getByText('업무')).toBeInTheDocument();
  expect(screen.getByText('업무')).toHaveClass('category-badge-1');
});

test('마감일 없을 때 "기한 없음" 표시', () => {
  const todoNoDue = { ...baseTodo, due_date: null };
  render(<TodoItem todo={todoNoDue} />);

  expect(screen.getByText('기한 없음')).toBeInTheDocument();
});

test('onToggle 콜백 호출', () => {
  const onToggle = vi.fn();
  render(<TodoItem todo={baseTodo} onToggle={onToggle} />);

  fireEvent.click(screen.getByRole('button', { name: '완료' }));
  expect(onToggle).toHaveBeenCalledWith('1', true);
});

test('onEdit 콜백 호출', () => {
  const onEdit = vi.fn();
  render(<TodoItem todo={baseTodo} onEdit={onEdit} />);

  fireEvent.click(screen.getByRole('button', { name: '수정' }));
  expect(onEdit).toHaveBeenCalledWith(baseTodo);
});

test('onDelete 콜백 호출', () => {
  const onDelete = vi.fn();
  render(<TodoItem todo={baseTodo} onDelete={onDelete} />);

  fireEvent.click(screen.getByRole('button', { name: '삭제' }));
  expect(onDelete).toHaveBeenCalledWith('1');
});
