
import { useEffect, useRef } from 'react';

const escStack: Array<() => void> = [];
let listenerRegistered = false;

function ensureListener() {
  if (listenerRegistered) return;
  listenerRegistered = true;
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    console.log('ESC 스택 크기:', escStack.length);
    if (escStack.length === 0) return;
    e.stopImmediatePropagation();
    escStack[escStack.length - 1]();
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
    console.log('useEscClose push, isOpen:', isOpen);
    const handler = () => onCloseRef.current();
    escStack.push(handler);
    console.log('스택 크기 after push:', escStack.length);

    return () => {
      const idx = escStack.lastIndexOf(handler);
      if (idx !== -1) escStack.splice(idx, 1);
      console.log('스택 크기 after pop:', escStack.length);
    };
  }, [isOpen]);
}
