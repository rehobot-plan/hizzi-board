'use client';

import CalendarV2 from '@/components/CalendarV2';
import { EventInput } from '@fullcalendar/core';
import { mergeConsecutiveLeave, LeaveLikeEvent } from '@/lib/calendar-helpers';

const SEED_EVENTS: (EventInput & LeaveLikeEvent)[] = [
  // A: 멀티데이 단독 (4/1~4/3, 업무 전체)
  { id: 'seed-a1', title: '[A] 멀티데이 3일', start: '2026-04-01', end: '2026-04-04', color: '#3B6D11' },

  // B: 멀티데이 + 단일 혼합 (업무 나만 + 업무 지정)
  { id: 'seed-b1', title: '[B] 멀티 2일', start: '2026-04-07', end: '2026-04-09', color: '#185FA5' },
  { id: 'seed-b2', title: '[B] 단일 이벤트', start: '2026-04-07', end: '2026-04-08', color: '#854F0B' },

  // C: 연차 연속 3일 (전처리 대상)
  {
    id: 'seed-c1', title: '[C] 한다슬 연차', start: '2026-04-13', end: '2026-04-14',
    color: '#534AB7', extendedProps: { leaveUserId: 'user-handaseul', isLeave: true },
  },
  {
    id: 'seed-c2', title: '[C] 한다슬 연차', start: '2026-04-14', end: '2026-04-15',
    color: '#534AB7', extendedProps: { leaveUserId: 'user-handaseul', isLeave: true },
  },
  {
    id: 'seed-c3', title: '[C] 한다슬 연차', start: '2026-04-15', end: '2026-04-16',
    color: '#534AB7', extendedProps: { leaveUserId: 'user-handaseul', isLeave: true },
  },

  // D: 멀티 2개 겹침 + 단일
  { id: 'seed-d1', title: '[D] 긴 멀티 5일', start: '2026-04-20', end: '2026-04-25', color: '#993556' },
  { id: 'seed-d2', title: '[D] 짧은 멀티 3일', start: '2026-04-22', end: '2026-04-25', color: '#378ADD' },
  { id: 'seed-d3', title: '[D] 단일 4/22', start: '2026-04-22', end: '2026-04-23', color: '#BA7517' },
];

export default function CalendarV2Page() {
  const merged = mergeConsecutiveLeave(SEED_EVENTS);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: '#2C1810', marginBottom: 12 }}>
        CalendarV2 Phase 1 — Shell
      </h1>
      <CalendarV2 events={merged} initialYear={2026} initialMonth={3} />
    </div>
  );
}
