import { useEffect } from 'react';

// ESC 핸들러 스택 — 가장 마지막 등록된 것만 실행
const escStack: (() => void)[] = [];

export function useEscClose(onClose: () => void, isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    escStack.push(onClose);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const top = escStack[escStack.length - 1];
      if (top) top();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const idx = escStack.lastIndexOf(onClose);
      if (idx !== -1) escStack.splice(idx, 1);
    };
  }, [isOpen, onClose]);
}
