import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    title: '삭제 확인',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    children: <p>정말 삭제하시겠습니까?</p>,
  };

  it('title 렌더링', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('삭제 확인')).toBeInTheDocument();
  });

  it('children 렌더링', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument();
  });

  it('기본 확인/취소 버튼 레이블', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('확인')).toBeInTheDocument();
    expect(screen.getByText('취소')).toBeInTheDocument();
  });

  it('커스텀 버튼 레이블', () => {
    render(<Modal {...defaultProps} confirmLabel="삭제" cancelLabel="닫기" />);
    expect(screen.getByText('삭제')).toBeInTheDocument();
    expect(screen.getByText('닫기')).toBeInTheDocument();
  });

  it('확인 버튼 클릭 시 onConfirm 호출', async () => {
    const onConfirm = vi.fn();
    render(<Modal {...defaultProps} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByText('확인'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('취소 버튼 클릭 시 onCancel 호출', async () => {
    const onCancel = vi.fn();
    render(<Modal {...defaultProps} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('취소'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('isLoading이 true이면 확인 버튼 비활성화', () => {
    render(<Modal {...defaultProps} isLoading />);
    const buttons = screen.getAllByRole('button');
    const confirmBtn = buttons.find((b) => b.textContent === '...');
    expect(confirmBtn).toBeDisabled();
  });

  it('오버레이 렌더링', () => {
    const { container } = render(<Modal {...defaultProps} />);
    expect(container.querySelector('.modal-overlay')).toBeInTheDocument();
  });
});
