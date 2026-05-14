import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

describe('Button', () => {
  it('children을 렌더링', () => {
    render(<Button>저장</Button>);
    expect(screen.getByText('저장')).toBeInTheDocument();
  });

  it('isLoading이 true이면 "..." 표시', () => {
    render(<Button isLoading>저장</Button>);
    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.queryByText('저장')).not.toBeInTheDocument();
  });

  it('isLoading이 true이면 disabled 처리', () => {
    render(<Button isLoading>저장</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disabled prop이 true이면 비활성화', () => {
    render(<Button disabled>저장</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('클릭 이벤트 호출', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>클릭</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled 상태에서 클릭 이벤트 미호출', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>클릭</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('variant에 따른 클래스 적용', () => {
    const { rerender } = render(<Button variant="primary">btn</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');

    rerender(<Button variant="secondary">btn</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');

    rerender(<Button variant="danger">btn</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-danger');
  });

  it('size에 따른 클래스 적용', () => {
    const { rerender } = render(<Button size="sm">btn</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-sm');

    rerender(<Button size="lg">btn</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-lg');
  });

  it('기본 variant는 primary, 기본 size는 md', () => {
    render(<Button>btn</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('btn-primary');
    expect(btn).toHaveClass('btn-md');
  });
});
