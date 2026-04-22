'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const tabs = [
  { label: '오늘', href: '/mydesk/today' },
  { label: '요청', href: '/mydesk/request' },
  { label: '할일', href: '/mydesk/todo' },
  { label: '메모', href: '/mydesk/memo' },
  { label: '달력', href: '/mydesk/calendar' },
];

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  // 모바일 가로 스크롤 시 활성 탭을 뷰포트 내로 자동 스크롤 (mydesk.md §9)
  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [pathname]);

  return (
    <div
      data-testid="mydesk-tabbar"
      style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid #EDE5DC',
        marginBottom: 24,
        position: 'sticky',
        top: 72,
        zIndex: 40,
        background: '#FDF8F4',
        minHeight: 48,
        alignItems: 'stretch',
        padding: '0 32px',
        overflowX: 'auto',
      }}
    >
      {tabs.map(tab => {
        const isActive = pathname === tab.href;
        return (
          <button
            key={tab.href}
            ref={isActive ? activeBtnRef : null}
            onClick={() => router.push(tab.href)}
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#2C1810' : '#9E8880',
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid #C17B6B' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = '#FDF8F4';
                e.currentTarget.style.color = '#7A2828';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#9E8880';
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
