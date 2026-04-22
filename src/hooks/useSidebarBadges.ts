'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import { computeBadges, type SidebarBadges } from '@/lib/sidebarBadges';

/**
 * Sidebar 3뱃지 + 오늘 탭 요청 카드 공통 훅 (mydesk.md §10.4 정합성 계약)
 */
export function useSidebarBadges(): SidebarBadges {
  const email = useAuthStore((s) => s.user?.email || '');
  const requests = useTodoRequestStore((s) => s.requests);
  return useMemo(() => computeBadges(requests, email), [requests, email]);
}
