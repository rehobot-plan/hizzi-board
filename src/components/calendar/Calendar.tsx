'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useLeaveStore } from '@/store/leaveStore';
import { buildCalendarEventInputs, CalendarEventDoc, CalendarEventInput } from '@/lib/calendar-helpers';
import CalendarGrid from './CalendarGrid';

/**
 * 캘린더 컨테이너 — Phase 1 (렌더 전용)
 *
 * 데이터 소스:
 * - calendarEvents: Firestore onSnapshot 실시간 구독
 * - leaveEvents: leaveStore (이미 onSnapshot 구독됨)
 *
 * Phase 2: CRUD 모달 + 이벤트 핸들러
 * Phase 3: 드래그·연차 폼·상세 모달
 */
export default function CalendarContainer() {
  const { events: leaveEvents } = useLeaveStore();
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventDoc[]>([]);
  const [eventInputs, setEventInputs] = useState<CalendarEventInput[]>([]);

  // Firestore calendarEvents 실시간 구독
  useEffect(() => {
    const q = query(collection(db, 'calendarEvents'), orderBy('startDate'));
    return onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as CalendarEventDoc[];
      setCalendarEvents(docs);
    });
  }, []);

  // 어댑터: calendarEvents + leaveEvents → EventInput[]
  useEffect(() => {
    const inputs = buildCalendarEventInputs(calendarEvents, leaveEvents);
    setEventInputs(inputs);
  }, [calendarEvents, leaveEvents]);

  return <CalendarGrid events={eventInputs} />;
}
