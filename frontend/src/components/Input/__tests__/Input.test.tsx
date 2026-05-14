import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Input from '../Input';

describe('Input', () => {
  it('기본 input 렌더링', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('label이 있으면 표시', () => {
    render(<Input label="이메일" />);
    expect(screen.getByText('이메일')).toBeInTheDocument();
  });

  it('label이 없으면 미표시', () => {
    render(<Input />);
    expect(screen.queryByText('이메일')).not.toBeInTheDocument();
  });

  it('error가 있으면 에러 메시지 표시', () => {
    render(<Input error="필수 입력" />);
    expect(screen.getByText('필수 입력')).toBeInTheDocument();
  });

  it('error가 있으면 input에 input-error 클래스 적용', () => {
    render(<Input error="오류" />);
    expect(screen.getByRole('textbox')).toHaveClass('input-error');
  });

  it('error가 없으면 input-error 클래스 미적용', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).not.toHaveClass('input-error');
  });

  it('type prop 전달', () => {
    render(<Input type="password" />);
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
  });

  it('placeholder prop 전달', () => {
    render(<Input placeholder="입력하세요" />);
    expect(screen.getByPlaceholderText('입력하세요')).toBeInTheDocument();
  });
});
