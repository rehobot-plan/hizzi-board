'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { initRequestListener } from '@/store/todoRequestStore';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';

interface MenuItem {
  label: string;
  href: string;
  key: string;
  sub?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { label: 'HOME', href: '/', key: 'home' },
  { label: 'MY DESK', href: '/mydesk', key: 'mydesk' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { users } = useUserStore();
  const { receivedPending: receivedCount, sentPending: sentCount, inProgress: inProgressCount } = useSidebarBadges();

  const currentUser = users.find((u) => u.email === user?.email);
  const hasLeavePermission = currentUser?.leaveViewPermission && currentUser.leaveViewPermission !== 'none';
  const email = user?.email || '';

  // 기타 접힘/펼침 — localStorage 세션 간 기억
  const [miscExpanded, setMiscExpanded] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('sidebar-misc-expanded');
    if (stored !== null) setMiscExpanded(stored === 'true');
  }, []);
  const toggleMisc = () => {
    const next = !miscExpanded;
    setMiscExpanded(next);
    localStorage.setItem('sidebar-misc-expanded', String(next));
  };

  // 리스너
  useEffect(() => {
    if (!email) return;
    const cleanupReq = initRequestListener(email);
    return () => { cleanupReq(); };
  }, [email]);

  // 3뱃지 카운트는 useSidebarBadges 공용 훅 (mydesk.md §10.4)

  const isActive = (href: string, key: string) => {
    if (key === 'home') return pathname === '/';
    if (key === 'mydesk') return pathname.startsWith('/mydesk') || pathname === '/request' || pathname.startsWith('/request/');
    return pathname === href;
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? '#7A2828' : 'transparent',
    color: active ? '#F5E6E0' : '#EDE5DC',
    letterSpacing: '0.05em',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  });

  const badgeStyle = (bg: string): React.CSSProperties => ({
    minWidth: 20,
    height: 14,
    padding: '0 5px',
    fontSize: 10,
    fontWeight: 500,
    lineHeight: '14px',
    textAlign: 'center',
    borderRadius: 10,
    background: bg,
    color: '#fff',
  });

  return (
    <aside
      data-testid="sidebar"
      className="hidden md:flex flex-col w-[180px] bg-[#5C1F1F] py-8 px-4 flex-shrink-0"
      style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}
    >
      <div>
        <div className="mb-10 select-none cursor-pointer transition-opacity hover:opacity-80" onClick={() => router.push('/')}>
          <span className="block text-white text-xl font-extrabold tracking-[0.15em] uppercase text-center" style={{ letterSpacing: '0.15em' }}>
            HIZZI BOARD
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const active = isActive(item.href, item.key);
            const showBadges = item.key === 'mydesk' && (receivedCount > 0 || sentCount > 0 || inProgressCount > 0);
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.href)}
                className="w-full text-left px-3 py-2 rounded text-xs font-medium transition-all"
                style={btnStyle(active)}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(122,40,40,0.3)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span>{item.label}</span>
                {showBadges && (
                  <span style={{ display: 'flex', gap: 4 }}>
                    {receivedCount > 0 && (
                      <span data-testid="badge-received" style={badgeStyle('#993556')}>
                        {receivedCount}
                      </span>
                    )}
                    {sentCount > 0 && (
                      <span data-testid="badge-sent" style={badgeStyle('#C17B6B')}>
                        {sentCount}
                      </span>
                    )}
                    {inProgressCount > 0 && (
                      <span data-testid="badge-progress" style={badgeStyle('#9E8880')}>
                        {inProgressCount}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 기타 섹션 — 하단 부착 (mt-auto) */}
      <nav data-testid="sidebar-misc" className="flex flex-col gap-1 mt-auto mb-4">
        <button
          onClick={toggleMisc}
          className="w-full text-left px-3 py-2 rounded text-xs font-medium transition-all"
          style={{ ...btnStyle(false), cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(122,40,40,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <span>기타 {miscExpanded ? '▾' : '▸'}</span>
        </button>
        {miscExpanded && hasLeavePermission && (
          <button
            onClick={() => router.push('/leave')}
            className="w-full text-left px-3 py-2 rounded text-xs font-medium transition-all"
            style={{ ...btnStyle(pathname === '/leave'), paddingLeft: 24 }}
            onMouseEnter={e => { if (pathname !== '/leave') e.currentTarget.style.background = 'rgba(122,40,40,0.3)'; }}
            onMouseLeave={e => { if (pathname !== '/leave') e.currentTarget.style.background = 'transparent'; }}
          >
            연차
          </button>
        )}
      </nav>

    </aside>
  );
}
