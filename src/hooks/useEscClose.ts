'use client';

import { useEffect, useRef } from 'react';

type Handler = () => void;

const escStack: Handler[] = [];
let listenerRegistered = false;

function ensureListener() {
  if (typeof window === 'undefined') return;
  if (listenerRegistered) return;
  listenerRegistered = true;
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
    ensureListener();
    if (!isOpen) return;
    const handler: Handler = () => onCloseRef.current();
    escStack.push(handler);
    return () => {
      const idx = escStack.lastIndexOf(handler);
      if (idx !== -1) escStack.splice(idx, 1);
    };
  }, [isOpen]);
}