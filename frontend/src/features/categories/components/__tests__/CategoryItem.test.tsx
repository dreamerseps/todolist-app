import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryItem from '../CategoryItem';
import type { Category } from '@/types';

const userCategory: Category = { id: 'c1', user_id: 'u1', name: '개인', is_default: false };
const defaultCategory: Category = { id: 'c0', user_id: null, name: '업무', is_default: true };

describe('CategoryItem 렌더링', () => {
  it('카테고리 이름 표시', () => {
    render(<CategoryItem category={userCategory} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('개인')).toBeInTheDocument();
  });

  it('기본 카테고리에 "기본" 배지 표시', () => {
    render(<CategoryItem category={defaultCategory} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('기본')).toBeInTheDocument();
  });

  it('일반 카테고리에 "기본" 배지 없음', () => {
    render(<CategoryItem category={userCategory} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText('기본')).not.toBeInTheDocument();
  });

  it('기본 카테고리 수정 버튼 비활성화', () => {
    render(<CategoryItem category={defaultCategory} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: '수정' })).toBeDisabled();
  });

  it('기본 카테고리 삭제 버튼 비활성화', () => {
    render(<CategoryItem category={defaultCategory} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: '삭제' })).toBeDisabled();
  });

  it('일반 카테고리 수정 버튼 활성화', () => {
    render(<CategoryItem category={userCategory} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: '수정' })).not.toBeDisabled();
  });

  it('일반 카테고리 삭제 버튼 활성화', () => {
    render(<CategoryItem category={userCategory} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: '삭제' })).not.toBeDisabled();
  });

  it('기본 카테고리에 category-item-default 클래스', () => {
    const { container } = render(<CategoryItem category={defaultCategory} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    expect(container.querySelector('.category-item-default')).toBeInTheDocument();
  });
});

describe('CategoryItem 편집 모드', () => {
  it('수정 버튼 클릭 시 편집 input 표시', async () => {
    render(<CategoryItem category={userCategory} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: '수정' }));
    expect(screen.getByRole('textbox', { name: '카테고리 이름 편집' })).toBeInTheDocument();
  });

  it('편집 input에 기존 이름 pre-fill', async () => {
    render(<CategoryItem category={userCategory} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: '수정' }));
    expect(screen.getByRole('textbox', { name: '카테고리 이름 편집' })).toHaveValue('개인');
  });

  it('편집 확인 시 onUpdate 호출', async () => {
    const onUpdate = vi.fn();
    render(<CategoryItem category={userCategory} onUpdate={onUpdate} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: '수정' }));
    const input = screen.getByRole('textbox', { name: '카테고리 이름 편집' });
    await userEvent.clear(input);
    await userEvent.type(input, '수정된 이름');
    await userEvent.click(screen.getByRole('button', { name: '편집 확인' }));
    expect(onUpdate).toHaveBeenCalledWith('c1', '수정된 이름');
  });

  it('편집 취소 시 이름 복원', async () => {
    render(<CategoryItem category={userCategory} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: '수정' }));
    const input = screen.getByRole('textbox', { name: '카테고리 이름 편집' });
    await userEvent.clear(input);
    await userEvent.type(input, '다른 이름');
    await userEvent.click(screen.getByRole('button', { name: '편집 취소' }));
    expect(screen.getByText('개인')).toBeInTheDocument();
  });

  it('Enter 키 입력 시 편집 확인', async () => {
    const onUpdate = vi.fn();
    render(<CategoryItem category={userCategory} onUpdate={onUpdate} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: '수정' }));
    const input = screen.getByRole('textbox', { name: '카테고리 이름 편집' });
    await userEvent.clear(input);
    await userEvent.type(input, '수정된 이름');
    await userEvent.keyboard('{Enter}');
    expect(onUpdate).toHaveBeenCalledWith('c1', '수정된 이름');
  });

  it('Escape 키 입력 시 편집 취소', async () => {
    render(<CategoryItem category={userCategory} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: '수정' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.getByText('개인')).toBeInTheDocument();
  });
});

describe('CategoryItem 삭제', () => {
  it('삭제 버튼 클릭 시 확인 Modal 표시', async () => {
    render(<CategoryItem category={userCategory} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(screen.getByText('카테고리 삭제')).toBeInTheDocument();
  });

  it('삭제 확인 시 onDelete 호출', async () => {
    const onDelete = vi.fn();
    render(<CategoryItem category={userCategory} onUpdate={vi.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onDelete).toHaveBeenCalledWith('c1');
  });

  it('삭제 취소 시 Modal 닫힘', async () => {
    render(<CategoryItem category={userCategory} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByText('카테고리 삭제')).not.toBeInTheDocument();
  });
});
