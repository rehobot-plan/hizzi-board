import { useEffect, useRef } from 'react';

const escStack: Array<() => void> = [];

if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    if (escStack.length === 0) return;
    e.stopImmediatePropagation();
    escStack[escStack.length - 1]();
  }, true);
}

export function useEscClose(onClose: () => void, isOpen: boolean) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const handler = () => onCloseRef.current();
    escStack.push(handler);

    return () => {
      const idx = escStack.lastIndexOf(handler);
      if (idx !== -1) escStack.splice(idx, 1);
    };
  }, [isOpen]);
}
