import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '@/stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [] });
  });

  it('초기 상태는 빈 토스트 배열', () => {
    expect(useUiStore.getState().toasts).toEqual([]);
  });

  it('showToast는 토스트를 추가', () => {
    useUiStore.getState().showToast('success', '저장 완료');
    const { toasts } = useUiStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('저장 완료');
    expect(toasts[0].id).toBeTruthy();
  });

  it('여러 토스트 추가 가능', () => {
    useUiStore.getState().showToast('success', '성공');
    useUiStore.getState().showToast('error', '오류');
    expect(useUiStore.getState().toasts).toHaveLength(2);
  });

  it('removeToast는 해당 id의 토스트 제거', () => {
    useUiStore.getState().showToast('warning', '경고');
    const id = useUiStore.getState().toasts[0].id;
    useUiStore.getState().removeToast(id);
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });

  it('removeToast는 다른 토스트 유지', () => {
    useUiStore.setState({
      toasts: [
        { id: '1', type: 'success', message: 'A' },
        { id: '2', type: 'error', message: 'B' },
      ],
    });
    useUiStore.getState().removeToast('1');
    const { toasts } = useUiStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('B');
  });
});
