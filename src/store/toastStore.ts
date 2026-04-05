import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type?: 'error' | 'success' | 'info';
}

type ToastInput = string | Omit<Toast, 'id'>;

interface ToastState {
  toasts: Toast[];
  addToast: (toast: ToastInput) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const nextToast = typeof toast === 'string'
      ? { id, message: toast }
      : { id, ...toast };

    set((state) => ({ toasts: [...state.toasts, nextToast] }));
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },
}));
