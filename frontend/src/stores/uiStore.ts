import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'warning';

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type UiState = {
  toasts: Toast[];
  showToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  showToast: (type, message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now().toString(), type, message }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
