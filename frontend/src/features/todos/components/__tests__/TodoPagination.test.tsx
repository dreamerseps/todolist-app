import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoPagination from '../TodoPagination';

describe('TodoPagination 렌더링', () => {
  it('totalPages <= 1 시 렌더링 없음', () => {
    const { container } = render(
      <TodoPagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('totalPages > 1 시 이전/다음 버튼 렌더링', () => {
    render(<TodoPagination page={2} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '이전' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument();
  });

  it('현재 페이지와 총 페이지 표시', () => {
    render(<TodoPagination page={2} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('/ 5')).toBeInTheDocument();
  });

  it('첫 페이지에서 이전 버튼 비활성화', () => {
    render(<TodoPagination page={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();
  });

  it('마지막 페이지에서 다음 버튼 비활성화', () => {
    render(<TodoPagination page={3} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it('중간 페이지에서 이전/다음 버튼 모두 활성화', () => {
    render(<TodoPagination page={2} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '이전' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: '다음' })).not.toBeDisabled();
  });
});

describe('TodoPagination 인터랙션', () => {
  it('이전 버튼 클릭 시 page-1 호출', async () => {
    const onPageChange = vi.fn();
    render(<TodoPagination page={3} totalPages={5} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole('button', { name: '이전' }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('다음 버튼 클릭 시 page+1 호출', async () => {
    const onPageChange = vi.fn();
    render(<TodoPagination page={3} totalPages={5} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(onPageChange).toHaveBeenCalledWith(4);
  });
});
