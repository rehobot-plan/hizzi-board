'use client';

import CalendarContainer from '@/components/calendar/Calendar';

/**
 * /calendar-poc — Phase 1 검증 페이지
 * 실 Firestore 데이터를 CalendarContainer → CalendarGrid으로 렌더.
 */
export default function CalendarPocPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: '#2C1810', marginBottom: 12 }}>
        Calendar Phase 1 — Firestore 실데이터 렌더
      </h1>
      <CalendarContainer />
    </div>
  );
}
