import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoFilter from '../TodoFilter';
import type { Category, TodoFilter as TodoFilterType } from '@/types';

const categories: Category[] = [
  { id: 'c1', user_id: null, name: '업무', is_default: true },
  { id: 'c2', user_id: 'u1', name: '개인', is_default: false },
];

const emptyFilter: TodoFilterType = {};

function renderFilter(filter: TodoFilterType = emptyFilter, onFilterChange = vi.fn(), onReset = vi.fn()) {
  return render(
    <TodoFilter
      filter={filter}
      categories={categories}
      onFilterChange={onFilterChange}
      onReset={onReset}
    />,
  );
}

describe('TodoFilter 렌더링', () => {
  it('카테고리 Select 렌더링', () => {
    renderFilter();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('날짜 입력 필드 렌더링', () => {
    renderFilter();
    expect(screen.getByLabelText('시작일')).toBeInTheDocument();
    expect(screen.getByLabelText('종료일')).toBeInTheDocument();
  });

  it('완료 여부 탭 3개 렌더링', () => {
    renderFilter();
    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '완료' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '미완료' })).toBeInTheDocument();
  });

  it('활성 필터 없을 때 초기화 버튼 미표시', () => {
    renderFilter();
    expect(screen.queryByRole('button', { name: '초기화' })).not.toBeInTheDocument();
  });

  it('카테고리 필터 활성 시 초기화 버튼 표시', () => {
    renderFilter({ category_id: 'c1' });
    expect(screen.getByRole('button', { name: '초기화' })).toBeInTheDocument();
  });

  it('완료 필터 활성 시 초기화 버튼 표시', () => {
    renderFilter({ is_completed: true });
    expect(screen.getByRole('button', { name: '초기화' })).toBeInTheDocument();
  });
});

describe('TodoFilter 인터랙션', () => {
  it('완료 탭 클릭 시 is_completed=true 전달', async () => {
    const onFilterChange = vi.fn();
    renderFilter(emptyFilter, onFilterChange);

    await userEvent.click(screen.getByRole('button', { name: '완료' }));

    expect(onFilterChange).toHaveBeenCalledWith({ is_completed: true });
  });

  it('미완료 탭 클릭 시 is_completed=false 전달', async () => {
    const onFilterChange = vi.fn();
    renderFilter(emptyFilter, onFilterChange);

    await userEvent.click(screen.getByRole('button', { name: '미완료' }));

    expect(onFilterChange).toHaveBeenCalledWith({ is_completed: false });
  });

  it('전체 탭 클릭 시 is_completed=undefined 전달', async () => {
    const onFilterChange = vi.fn();
    renderFilter({ is_completed: true }, onFilterChange);

    await userEvent.click(screen.getByRole('button', { name: '전체' }));

    expect(onFilterChange).toHaveBeenCalledWith({ is_completed: undefined });
  });

  it('초기화 버튼 클릭 시 onReset 호출', async () => {
    const onReset = vi.fn();
    renderFilter({ category_id: 'c1' }, vi.fn(), onReset);

    await userEvent.click(screen.getByRole('button', { name: '초기화' }));

    expect(onReset).toHaveBeenCalled();
  });

  it('시작일 변경 시 from 업데이트', async () => {
    const onFilterChange = vi.fn();
    renderFilter(emptyFilter, onFilterChange);

    const fromInput = screen.getByLabelText('시작일');
    await userEvent.type(fromInput, '2026-05-01');

    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ from: expect.any(String) }));
  });
});

describe('TodoFilter 모바일 토글', () => {
  it('필터 토글 버튼 렌더링', () => {
    renderFilter();
    expect(screen.getByRole('button', { name: '필터 토글' })).toBeInTheDocument();
  });

  it('토글 버튼 클릭 시 필터 숨김', async () => {
    renderFilter();
    await userEvent.click(screen.getByRole('button', { name: '필터 토글' }));
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('토글 버튼 재클릭 시 필터 다시 표시', async () => {
    renderFilter();
    const toggleBtn = screen.getByRole('button', { name: '필터 토글' });
    await userEvent.click(toggleBtn);
    await userEvent.click(toggleBtn);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('기본 상태는 펼쳐진 상태(aria-expanded=true)', () => {
    renderFilter();
    expect(screen.getByRole('button', { name: '필터 토글' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('토글 후 aria-expanded=false', async () => {
    renderFilter();
    await userEvent.click(screen.getByRole('button', { name: '필터 토글' }));
    expect(screen.getByRole('button', { name: '필터 토글' })).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('TodoFilter 완료 상태 표시', () => {
  it('is_completed=true 시 완료 탭 active 클래스', () => {
    renderFilter({ is_completed: true });
    const completedBtn = screen.getByRole('button', { name: '완료' });
    expect(completedBtn).toHaveClass('active');
  });

  it('is_completed=false 시 미완료 탭 active 클래스', () => {
    renderFilter({ is_completed: false });
    const incompleteBtn = screen.getByRole('button', { name: '미완료' });
    expect(incompleteBtn).toHaveClass('active');
  });

  it('is_completed=undefined 시 전체 탭 active 클래스', () => {
    renderFilter();
    const allBtn = screen.getByRole('button', { name: '전체' });
    expect(allBtn).toHaveClass('active');
  });
});
