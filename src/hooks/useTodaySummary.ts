'use client';

import { useMemo } from 'react';
import { usePostStore } from '@/store/postStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import { useAuthStore } from '@/store/authStore';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { isToday, isThisWeek, daysUntil, formatDateKey } from '@/lib/dateUtils';
import { UrgentItem } from '@/components/mydesk/UrgentList';
import { calendarEvent, tagColors } from '@/styles/tokens';

interface TodaySummary {
  counts: {
    todoToday: number;
    eventToday: number;
    eventThisWeek: number;
    receivedPending: number; // 요청 메인 K — 사이드바 받은 뱃지와 동일 쿼리 (mydesk.md §10.4)
    sentPending: number;     // 요청 보조 N
    inProgress: number;      // 요청 보조 M
    overdue: number;         // 기한 지난 미완료 — taskType 무관
  };
  urgentItems: UrgentItem[];
}

export function useTodaySummary(): TodaySummary {
  const { user } = useAuthStore();
  const { posts } = usePostStore();
  const { events: calendarEvents } = useCalendarStore();
  const { requests } = useTodoRequestStore();
  const badges = useSidebarBadges();

  const email = user?.email || '';

  return useMemo(() => {
    // 내 할일: author=me + 미완료·미삭제 (taskType 무관, 업무·요청·개인 전부)
    const myPosts = posts.filter(p =>
      p.author === email &&
      !p.completed && !p.deleted
    );

    const todayKey = formatDateKey(new Date());

    const todoToday = myPosts.filter(p => isToday(p.dueDate)).length;
    const overdue = myPosts.filter(p => p.dueDate && p.dueDate < todayKey).length;

    // 내 일정: authorId=me 또는 visibility='all'
    const myCalEvents = calendarEvents.filter(e =>
      e.authorId === email || e.visibility === 'all'
    );
    const eventToday = myCalEvents.filter(e => e.startDate <= todayKey && e.endDate >= todayKey).length;
    const eventThisWeek = myCalEvents.filter(e => isThisWeek(e.startDate)).length;

    // 요청 3분기는 useSidebarBadges 공용 훅 (mydesk.md §10.4)
    const { receivedPending, sentPending, inProgress } = badges;

    // 시급 리스트
    const urgent: UrgentItem[] = [];

    // 오늘 기한 할일
    myPosts.filter(p => isToday(p.dueDate)).forEach(p => {
      const isRequest = !!p.requestId;
      urgent.push({
        id: p.id,
        type: 'todo',
        title: p.content,
        leftBorderColor: isRequest ? tagColors.category.request.fg : p.taskType === 'personal' ? tagColors.category.personal.fg : tagColors.category.work.fg,
        rightBadge: { kind: 'today', value: '오늘', color: calendarEvent.render.textOnSolid, bg: tagColors.category.work.fg },
        sortKey: 0,
      });
    });

    // D-3 이내 할일 (오늘 제외)
    myPosts.filter(p => {
      if (!p.dueDate || isToday(p.dueDate)) return false;
      const d = daysUntil(p.dueDate);
      return d > 0 && d <= 3;
    }).forEach(p => {
      const d = daysUntil(p.dueDate);
      const isRequest = !!p.requestId;
      urgent.push({
        id: p.id,
        type: 'todo',
        title: p.content,
        leftBorderColor: isRequest ? tagColors.category.request.fg : p.taskType === 'personal' ? tagColors.category.personal.fg : tagColors.category.work.fg,
        rightBadge: { kind: 'd-n', value: `D-${d}`, color: tagColors.category.work.fg, bg: tagColors.category.work.bg },
        sortKey: d,
      });
    });

    // 오늘 일정
    myCalEvents.filter(e => e.startDate <= todayKey && e.endDate >= todayKey).forEach(e => {
      urgent.push({
        id: e.id,
        type: 'event',
        title: e.title,
        leftBorderColor: e.color || calendarEvent.work.all,
        rightBadge: { kind: 'time', value: '일정', color: calendarEvent.work.all, bg: calendarEvent.work.rangeBg },
        sortKey: 0.5,
      });
    });

    // 미확인 요청
    requests.filter(r => r.toEmail === email && r.status === 'pending').forEach(r => {
      urgent.push({
        id: r.id,
        type: 'request',
        title: r.title,
        leftBorderColor: tagColors.category.request.fg,
        rightBadge: { kind: 'request', value: '미확인', color: tagColors.category.request.fg, bg: tagColors.category.request.bg },
        sortKey: 1,
      });
    });

    urgent.sort((a, b) => a.sortKey - b.sortKey);

    return {
      counts: { todoToday, eventToday, eventThisWeek, receivedPending, sentPending, inProgress, overdue },
      urgentItems: urgent,
    };
  }, [posts, calendarEvents, requests, email, badges]);
}
