'use client';

import { useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';

export default function GlobalMenu() {
  const { menu, closeMenu } = useUIStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu.open) return;

    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const menuEl = menuRef.current;
      if (rect.right > window.innerWidth) {
        menuEl.style.left = 'auto';
        menuEl.style.right = (window.innerWidth - menu.x) + 'px';
      }
      if (rect.bottom > window.innerHeight) {
        menuEl.style.top = 'auto';
        menuEl.style.bottom = (window.innerHeight - menu.y) + 'px';
      }
    }
  }, [menu.open, menu.x, menu.y]);

  if (!menu.open) return null;

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        onClick={closeMenu}
      />
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: menu.y,
          left: menu.x,
          background: '#fff',
          border: '1px solid #EDE5DC',
          zIndex: 9999,
          minWidth: 160,
          boxShadow: '0 4px 12px rgba(44,20,16,0.12)',
        }}
      >
        {menu.groups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div style={{ borderTop: '1px solid #EDE5DC', margin: '4px 0' }} />}
            {group.groupLabel && (
              <div style={{ padding: '4px 14px', fontSize: 10, color: '#C4B8B0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {group.groupLabel}
              </div>
            )}
            {group.actions.map((action, ai) => (
              <button
                key={ai}
                onClick={() => {
                  const fn = action.onClick;
                  closeMenu();
                  setTimeout(() => fn(), 0);
                }}
                style={{
                  display: 'block', width: '100%', padding: '8px 14px',
                  textAlign: 'left', fontSize: 12,
                  color: action.color || '#2C1810',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = action.hoverBg || '#FDF8F4')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {action.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}