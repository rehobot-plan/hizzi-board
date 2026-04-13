'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput } from '@fullcalendar/core';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

/**
 * FullCalendar PoC — 멀티데이 row 정렬 검증
 *
 * 검증 케이스:
 *   A: 멀티데이 일정 단독
 *   B: 멀티데이 + 단일 일정 같은 날 혼합
 *   C: 연차 (1일짜리 여러 개 연속)
 *   D: 멀티데이 2개 겹침
 */

// 더미 시드 데이터 (4가지 케이스 보장)
const SEED_EVENTS: EventInput[] = [
  // 케이스 A: 멀티데이 단독 (4/1~4/3)
  { id: 'seed-a1', title: '[A] 멀티데이 3일', start: '2026-04-01', end: '2026-04-04', color: '#3B6D11' },

  // 케이스 B: 멀티데이 + 단일 혼합 (4/7~4/8 + 4/7 단일)
  { id: 'seed-b1', title: '[B] 멀티 2일', start: '2026-04-07', end: '2026-04-09', color: '#185FA5' },
  { id: 'seed-b2', title: '[B] 단일 이벤트', start: '2026-04-07', end: '2026-04-08', color: '#854F0B' },

  // 케이스 C: 연차 연속 3일 (4/13~4/15, 각각 단일 이벤트)
  { id: 'seed-c1', title: '[C] 한다슬 연차', start: '2026-04-13', end: '2026-04-14', color: '#534AB7' },
  { id: 'seed-c2', title: '[C] 한다슬 연차', start: '2026-04-14', end: '2026-04-15', color: '#534AB7' },
  { id: 'seed-c3', title: '[C] 한다슬 연차', start: '2026-04-15', end: '2026-04-16', color: '#534AB7' },

  // 케이스 D: 멀티데이 2개 겹침 (4/20~4/24 + 4/22~4/25)
  { id: 'seed-d1', title: '[D] 긴 멀티 5일', start: '2026-04-20', end: '2026-04-25', color: '#993556' },
  { id: 'seed-d2', title: '[D] 짧은 멀티 3일', start: '2026-04-22', end: '2026-04-25', color: '#378ADD' },
  { id: 'seed-d3', title: '[D] 단일 4/22', start: '2026-04-22', end: '2026-04-23', color: '#BA7517' },
];

export default function CalendarPocPage() {
  const [firestoreEvents, setFirestoreEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'seed' | 'firestore' | 'both'>('both');

  // Firestore에서 기존 캘린더 이벤트 로드
  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, 'calendarEvents'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const events: EventInput[] = snap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            title: d.title || '(제목 없음)',
            start: d.startDate,
            // FullCalendar end는 exclusive — 1일 추가
            end: addOneDayStr(d.endDate),
            color: d.color || '#3B6D11',
          };
        });
        setFirestoreEvents(events);
        console.log('[PoC] Firestore events loaded:', events.length);
      } catch (e) {
        console.error('[PoC] Firestore load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allEvents = source === 'seed' ? SEED_EVENTS
    : source === 'firestore' ? firestoreEvents
    : [...SEED_EVENTS, ...firestoreEvents];

  // 이벤트 배치 결과 로깅 (기능 검증용)
  const handleEventDidMount = (info: { event: { id: string; title: string }; el: HTMLElement }) => {
    const row = info.el.closest('.fc-daygrid-event-harness')?.getAttribute('style');
    console.log(`[PoC Row] id=${info.event.id} title="${info.event.title}" style="${row || 'N/A'}"`);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: '#2C1810', marginBottom: 12 }}>
        FullCalendar PoC — 멀티데이 row 정렬 검증
      </h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['seed', 'firestore', 'both'] as const).map(s => (
          <button key={s} onClick={() => setSource(s)}
            style={{
              padding: '4px 12px', fontSize: 12, cursor: 'pointer',
              border: source === s ? '2px solid #C17B6B' : '1px solid #EDE5DC',
              background: source === s ? '#FDF8F4' : '#fff',
              color: '#2C1810', borderRadius: 4,
            }}>
            {s === 'seed' ? '시드만' : s === 'firestore' ? 'Firestore만' : '시드+Firestore'}
          </button>
        ))}
        {loading && <span style={{ fontSize: 11, color: '#9E8880' }}>로딩 중...</span>}
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate="2026-04-01"
        locale="ko"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        events={allEvents}
        eventOrder="duration,-title"
        eventOrderStrict={true}
        dayMaxEvents={3}
        height="auto"
        eventDidMount={handleEventDidMount}
      />

      <div style={{ marginTop: 16, fontSize: 11, color: '#9E8880' }}>
        <p>eventOrder: duration,-title (긴 이벤트 위, 짧은 이벤트 아래)</p>
        <p>eventOrderStrict: true (엄격 정렬)</p>
        <p>dayMaxEvents: 3 (+more 자동 처리)</p>
      </div>
    </div>
  );
}

/** YYYY-MM-DD 문자열에 1일 추가 (FullCalendar end exclusive 대응) */
function addOneDayStr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
