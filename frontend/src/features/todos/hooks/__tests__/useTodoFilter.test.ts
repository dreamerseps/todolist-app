import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { useTodoFilter } from '../useTodoFilter';

function createWrapper(initialSearch = '') {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      MemoryRouter,
      { initialEntries: [`/${initialSearch}`] },
      children,
    );
}

test('초기 filter 기본값', () => {
  const { result } = renderHook(() => useTodoFilter(), { wrapper: createWrapper() });
  expect(result.current.filter.page).toBe(1);
  expect(result.current.filter.category_id).toBeUndefined();
  expect(result.current.filter.is_completed).toBeUndefined();
  expect(result.current.filter.sort).toBeUndefined();
});

test('URL 파라미터에서 filter 읽기', () => {
  const { result } = renderHook(() => useTodoFilter(), {
    wrapper: createWrapper('?category_id=cat1&is_completed=true&sort=due_date&page=3'),
  });
  expect(result.current.filter.category_id).toBe('cat1');
  expect(result.current.filter.is_completed).toBe(true);
  expect(result.current.filter.sort).toBe('due_date');
  expect(result.current.filter.page).toBe(3);
});

test('is_completed=false URL 파라미터 파싱', () => {
  const { result } = renderHook(() => useTodoFilter(), {
    wrapper: createWrapper('?is_completed=false'),
  });
  expect(result.current.filter.is_completed).toBe(false);
});

test('setFilter로 category_id 업데이트', () => {
  const { result } = renderHook(() => useTodoFilter(), { wrapper: createWrapper() });

  act(() => {
    result.current.setFilter({ category_id: 'cat1' });
  });

  expect(result.current.filter.category_id).toBe('cat1');
});

test('setFilter로 is_completed 업데이트', () => {
  const { result } = renderHook(() => useTodoFilter(), { wrapper: createWrapper() });

  act(() => {
    result.current.setFilter({ is_completed: true });
  });

  expect(result.current.filter.is_completed).toBe(true);
});

test('setFilter로 sort 업데이트', () => {
  const { result } = renderHook(() => useTodoFilter(), { wrapper: createWrapper() });

  act(() => {
    result.current.setFilter({ sort: 'due_date' });
  });

  expect(result.current.filter.sort).toBe('due_date');
});

test('setFilter로 page 업데이트', () => {
  const { result } = renderHook(() => useTodoFilter(), { wrapper: createWrapper() });

  act(() => {
    result.current.setFilter({ page: 3 });
  });

  expect(result.current.filter.page).toBe(3);
});

test('필터 변경 시 page가 초기화됨', () => {
  const { result } = renderHook(() => useTodoFilter(), {
    wrapper: createWrapper('?page=5'),
  });

  act(() => {
    result.current.setFilter({ category_id: 'cat1' });
  });

  expect(result.current.filter.page).toBe(1);
});

test('setFilter로 빈 값 전달 시 파라미터 삭제', () => {
  const { result } = renderHook(() => useTodoFilter(), {
    wrapper: createWrapper('?category_id=cat1'),
  });

  act(() => {
    result.current.setFilter({ category_id: undefined });
  });

  expect(result.current.filter.category_id).toBeUndefined();
});

test('resetFilter로 전체 초기화', () => {
  const { result } = renderHook(() => useTodoFilter(), {
    wrapper: createWrapper('?category_id=cat1&is_completed=true&page=3'),
  });

  act(() => {
    result.current.resetFilter();
  });

  expect(result.current.filter.category_id).toBeUndefined();
  expect(result.current.filter.is_completed).toBeUndefined();
  expect(result.current.filter.page).toBe(1);
});
