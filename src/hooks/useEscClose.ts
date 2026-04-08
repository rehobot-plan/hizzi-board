

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    __escStack: Array<() => void>;
    __escListenerRegistered: boolean;
  }
}

function getStack(): Array<() => void> {
  if (typeof window === 'undefined') return [];
  if (!window.__escStack) window.__escStack = [];
  return window.__escStack;
}

function ensureListener() {
  if (typeof window === 'undefined') return;
  if (window.__escListenerRegistered) return;
  window.__escListenerRegistered = true;
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    const stack = getStack();
    if (stack.length === 0) return;
    e.stopImmediatePropagation();
    stack[stack.length - 1]();
  }, true);
}

export function useEscClose(onClose: () => void, isOpen: boolean) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    ensureListener();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const stack = getStack();
    const handler = () => onCloseRef.current();
    stack.push(handler);
    return () => {
      const idx = stack.lastIndexOf(handler);
      if (idx !== -1) stack.splice(idx, 1);
    };
  }, [isOpen]);
}
