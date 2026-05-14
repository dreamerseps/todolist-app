import { render, screen } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import TodoList from '../TodoList';
import type { TodoItem, Category } from '@/types';

afterEach(() => {
  vi.clearAllMocks();
});

const makeTodo = (id: string, title: string): TodoItem => ({
  id,
  user_id: 'u1',
  category_id: 'c1',
  title,
  description: null,
  due_date: null,
  is_completed: false,
  created_at: '2026-05-14T00:00:00Z',
  updated_at: '2026-05-14T00:00:00Z',
});

const categories: Category[] = [
  { id: 'c1', user_id: 'u1', name: '업무', is_default: false },
];

test('여러 todo 아이템 렌더링', () => {
  const todos = [makeTodo('1', '첫 번째 할일'), makeTodo('2', '두 번째 할일')];
  render(<TodoList todos={todos} categories={categories} />);

  expect(screen.getByText('첫 번째 할일')).toBeInTheDocument();
  expect(screen.getByText('두 번째 할일')).toBeInTheDocument();
});

test('빈 배열 처리', () => {
  render(<TodoList todos={[]} />);

  const list = document.querySelector('.todo-list');
  expect(list).toBeInTheDocument();
  expect(list?.children).toHaveLength(0);
});
