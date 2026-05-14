import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Spinner from '../Spinner';

describe('Spinner', () => {
  it('기본 md 사이즈 렌더링', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('.spinner-md')).toBeInTheDocument();
  });

  it('sm 사이즈 클래스 적용', () => {
    const { container } = render(<Spinner size="sm" />);
    expect(container.querySelector('.spinner-sm')).toBeInTheDocument();
  });

  it('lg 사이즈 클래스 적용', () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.querySelector('.spinner-lg')).toBeInTheDocument();
  });

  it('spinner 클래스 포함', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });
});
