import { create } from 'zustand';

export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

export interface Toast {
  id: string;
  message: string;
  type?: 'error' | 'success' | 'info';
  /** 버튼 액션 (예: 실행 취소·되돌리기). 클릭 시 onClick 실행 후 자동 제거. */
  action?: ToastAction;
  /** 자동 제거까지 지연 ms. 지정 안 하면 수동 close만. */
  durationMs?: number;
}

type ToastInput = string | Omit<Toast, 'id'>;

interface ToastState {
  toasts: Toast[];
  addToast: (toast: ToastInput) => string;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextToast: Toast = typeof toast === 'string'
      ? { id, message: toast }
      : { id, ...toast };

    set((state) => ({ toasts: [...state.toasts, nextToast] }));

    if (nextToast.durationMs && nextToast.durationMs > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, nextToast.durationMs);
    }

    return id;
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },
}));
