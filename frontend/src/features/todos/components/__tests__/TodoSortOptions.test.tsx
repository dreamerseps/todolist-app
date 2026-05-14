import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoSortOptions from '../TodoSortOptions';

describe('TodoSortOptions', () => {
  it('정렬 드롭다운 렌더링', () => {
    render(<TodoSortOptions onSortChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('최신순(기본) 옵션 포함', () => {
    render(<TodoSortOptions onSortChange={vi.fn()} />);
    expect(screen.getByRole('option', { name: '최신순(기본)' })).toBeInTheDocument();
  });

  it('마감일 빠른 순 옵션 포함', () => {
    render(<TodoSortOptions onSortChange={vi.fn()} />);
    expect(screen.getByRole('option', { name: '마감일 빠른 순' })).toBeInTheDocument();
  });

  it('sort=due_date 선택 시 onSortChange 호출', async () => {
    const onSortChange = vi.fn();
    render(<TodoSortOptions onSortChange={onSortChange} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), 'due_date');

    expect(onSortChange).toHaveBeenCalledWith('due_date');
  });

  it('sort=created_at 선택 시 onSortChange 호출', async () => {
    const onSortChange = vi.fn();
    render(<TodoSortOptions sort="due_date" onSortChange={onSortChange} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), 'created_at');

    expect(onSortChange).toHaveBeenCalledWith('created_at');
  });

  it('sort 미지정 시 created_at 기본값', () => {
    render(<TodoSortOptions onSortChange={vi.fn()} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('created_at');
  });
});
