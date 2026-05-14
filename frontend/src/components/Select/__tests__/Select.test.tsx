import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from '../Select';

const options = [
  { value: '1', label: '옵션 1' },
  { value: '2', label: '옵션 2' },
];

describe('Select', () => {
  it('옵션 렌더링', () => {
    render(<Select options={options} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('label 표시', () => {
    render(<Select options={options} label="카테고리" />);
    expect(screen.getByText('카테고리')).toBeInTheDocument();
  });

  it('placeholder 표시', () => {
    render(<Select options={options} placeholder="선택하세요" />);
    expect(screen.getByText('선택하세요')).toBeInTheDocument();
  });

  it('error 메시지 표시', () => {
    render(<Select options={options} error="필수 선택" />);
    expect(screen.getByText('필수 선택')).toBeInTheDocument();
  });

  it('error가 있으면 select-error 클래스 적용', () => {
    render(<Select options={options} error="오류" />);
    expect(screen.getByRole('combobox')).toHaveClass('select-error');
  });

  it('onChange 호출', async () => {
    const onChange = vi.fn();
    render(<Select options={options} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), '1');
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('value 반영', () => {
    render(<Select options={options} value="2" onChange={vi.fn()} />);
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('2');
  });
});
