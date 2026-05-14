import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from '../Toast';
import ToastContainer from '../ToastContainer';
import { useUiStore } from '@/stores/uiStore';

describe('Toast', () => {
  it('메시지 렌더링', () => {
    render(<Toast id="1" type="success" message="성공했습니다" onClose={vi.fn()} />);
    expect(screen.getByText('성공했습니다')).toBeInTheDocument();
  });

  it('success 타입 클래스 적용', () => {
    const { container } = render(<Toast id="1" type="success" message="msg" onClose={vi.fn()} />);
    expect(container.querySelector('.toast-success')).toBeInTheDocument();
  });

  it('error 타입 클래스 적용', () => {
    const { container } = render(<Toast id="1" type="error" message="msg" onClose={vi.fn()} />);
    expect(container.querySelector('.toast-error')).toBeInTheDocument();
  });

  it('warning 타입 클래스 적용', () => {
    const { container } = render(<Toast id="1" type="warning" message="msg" onClose={vi.fn()} />);
    expect(container.querySelector('.toast-warning')).toBeInTheDocument();
  });

  it('닫기 버튼 클릭 시 onClose 호출', async () => {
    const onClose = vi.fn();
    render(<Toast id="abc" type="success" message="msg" onClose={onClose} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledWith('abc');
  });
});

describe('ToastContainer', () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [] });
  });

  afterEach(() => {
    useUiStore.setState({ toasts: [] });
  });

  it('토스트가 없으면 아무것도 표시 안 함', () => {
    const { container } = render(<ToastContainer />);
    expect(container.querySelector('.toast')).not.toBeInTheDocument();
  });

  it('스토어의 토스트 렌더링', () => {
    useUiStore.setState({
      toasts: [{ id: '1', type: 'success', message: '저장 완료' }],
    });
    render(<ToastContainer />);
    expect(screen.getByText('저장 완료')).toBeInTheDocument();
  });

  it('토스트 컨테이너 클래스 존재', () => {
    const { container } = render(<ToastContainer />);
    expect(container.querySelector('.toast-container')).toBeInTheDocument();
  });
});
