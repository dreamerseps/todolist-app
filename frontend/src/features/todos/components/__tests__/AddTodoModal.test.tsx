import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddTodoModal from '../AddTodoModal';
import type { Category } from '@/types';

const categories: Category[] = [
  { id: 'c1', user_id: null, name: '업무', is_default: true },
  { id: 'c2', user_id: 'u1', name: '개인', is_default: false },
];

function renderModal(onConfirm = vi.fn(), onCancel = vi.fn()) {
  return render(
    <AddTodoModal
      categories={categories}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
}

describe('AddTodoModal 렌더링', () => {
  it('모달 제목 표시', () => {
    renderModal();
    expect(screen.getByText('할일 추가')).toBeInTheDocument();
  });

  it('제목 입력 필드 렌더링', () => {
    renderModal();
    expect(screen.getByPlaceholderText('할일 제목 입력')).toBeInTheDocument();
  });

  it('카테고리 Select 렌더링', () => {
    renderModal();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('설명 입력 필드 렌더링', () => {
    renderModal();
    expect(screen.getByPlaceholderText('설명 입력')).toBeInTheDocument();
  });

  it('추가 버튼 렌더링', () => {
    renderModal();
    expect(screen.getByRole('button', { name: '추가' })).toBeInTheDocument();
  });

  it('취소 버튼 렌더링', () => {
    renderModal();
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
  });
});

describe('AddTodoModal 유효성 검사', () => {
  it('제목 없이 추가 시 에러 표시', async () => {
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: '추가' }));
    expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument();
  });

  it('카테고리 없이 추가 시 에러 표시', async () => {
    renderModal();
    await userEvent.type(screen.getByPlaceholderText('할일 제목 입력'), '새 할일');
    await userEvent.click(screen.getByRole('button', { name: '추가' }));
    expect(screen.getByText('카테고리를 선택해주세요.')).toBeInTheDocument();
  });

  it('onConfirm 미호출 (유효성 실패)', async () => {
    const onConfirm = vi.fn();
    render(<AddTodoModal categories={categories} onConfirm={onConfirm} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: '추가' }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe('AddTodoModal 성공 제출', () => {
  it('필수 필드 입력 후 onConfirm 호출', async () => {
    const onConfirm = vi.fn();
    render(<AddTodoModal categories={categories} onConfirm={onConfirm} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText('할일 제목 입력'), '새 할일');
    await userEvent.selectOptions(screen.getByRole('combobox'), 'c1');
    await userEvent.click(screen.getByRole('button', { name: '추가' }));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: '새 할일', category_id: 'c1' }),
    );
  });

  it('onCancel 호출', async () => {
    const onCancel = vi.fn();
    render(<AddTodoModal categories={categories} onConfirm={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('description 없을 때 undefined 전달', async () => {
    const onConfirm = vi.fn();
    render(<AddTodoModal categories={categories} onConfirm={onConfirm} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText('할일 제목 입력'), '제목');
    await userEvent.selectOptions(screen.getByRole('combobox'), 'c1');
    await userEvent.click(screen.getByRole('button', { name: '추가' }));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ description: undefined }),
    );
  });
});
