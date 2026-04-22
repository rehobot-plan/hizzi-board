'use client';

import { create } from 'zustand';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CalendarEventDoc } from '@/lib/calendar-helpers';

// calendar-helpers의 CalendarEventDoc를 그대로 사용 + MY DESK에 필요한 필드 확장
export interface CalendarEvent extends CalendarEventDoc {
  taskType?: string;
  visibility?: string;
  teamRequestId?: string;
}

interface CalendarState {
  events: CalendarEvent[];
  isInitialized: boolean;
}

export const useCalendarStore = create<CalendarState>(() => ({
  events: [],
  isInitialized: false,
}));

let calendarUnsubscribe: (() => void) | null = null;

export const initCalendarListener = () => {
  if (calendarUnsubscribe) {
    calendarUnsubscribe();
    calendarUnsubscribe = null;
  }

  const q = query(collection(db, 'calendarEvents'), orderBy('startDate'));
  calendarUnsubscribe = onSnapshot(q, (snapshot) => {
    const events = snapshot.docs
      .map((d) => {
        const data = d.data();
        if (!data.createdAt) return null;
        return { id: d.id, ...data } as CalendarEvent;
      })
      .filter((e): e is CalendarEvent => e !== null);
    useCalendarStore.setState({ events, isInitialized: true });
  });

  return () => {
    if (calendarUnsubscribe) {
      calendarUnsubscribe();
      calendarUnsubscribe = null;
    }
  };
};
