'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput } from '@fullcalendar/core';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

/**
 * FullCalendar PoC — 멀티데이 row 정렬 검증 (2차)
 *
 * 변경점 (1차 대비):
 *   1. eventOrder: '-duration,start,title' (긴 이벤트 위 강제)
 *   2. 연차 시드 데이터를 멀티데이×1로 합침 (케이스 C)
 *   3. mergeConsecutiveLeave() 전처리 함수 추가
 *
 * 검증 케이스:
 *   A: 멀티데이 일정 단독
 *   B: 멀티데이 + 단일 일정 같은 날 혼합
 *   C: 연차 3일 연속 (전처리로 멀티데이 변환)
 *   D: 멀티데이 2개 겹침 + 단일
 */

// 더미 시드 데이터 (4가지 케이스 보장)
const SEED_EVENTS: EventInput[] = [
  // 케이스 A: 멀티데이 단독 (4/1~4/3)
  { id: 'seed-a1', title: '[A] 멀티데이 3일', start: '2026-04-01', end: '2026-04-04', color: '#3B6D11' },

  // 케이스 B: 멀티데이 + 단일 혼합 (4/7~4/8 + 4/7 단일)
  { id: 'seed-b1', title: '[B] 멀티 2일', start: '2026-04-07', end: '2026-04-09', color: '#185FA5' },
  { id: 'seed-b2', title: '[B] 단일 이벤트', start: '2026-04-07', end: '2026-04-08', color: '#854F0B' },

  // 케이스 C: 연차 연속 3일 — 1일×3 원본 (전처리 대상)
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

  // 케이스 D: 멀티데이 2개 겹침 (4/20~4/24 + 4/22~4/25) + 단일
  { id: 'seed-d1', title: '[D] 긴 멀티 5일', start: '2026-04-20', end: '2026-04-25', color: '#993556' },
  { id: 'seed-d2', title: '[D] 짧은 멀티 3일', start: '2026-04-22', end: '2026-04-25', color: '#378ADD' },
  { id: 'seed-d3', title: '[D] 단일 4/22', start: '2026-04-22', end: '2026-04-23', color: '#BA7517' },
];

/**
 * 연차 연속 블록 전처리: 동일 leaveUserId + 인접 날짜 → 1개 멀티데이 이벤트로 합침
 * - 같은 날 2건 이상(반차 쌍)은 그룹핑 제외
 * - 원본 id 배열을 extendedProps.originalIds에 보존
 */
function mergeConsecutiveLeave(events: EventInput[]): EventInput[] {
  const leaves: EventInput[] = [];
  const others: EventInput[] = [];

  for (const ev of events) {
    if (ev.extendedProps?.isLeave && ev.extendedProps?.leaveUserId) {
      leaves.push(ev);
    } else {
      others.push(ev);
    }
  }

  if (leaves.length === 0) return events;

  // userId별 그룹핑
  const byUser = new Map<string, EventInput[]>();
  for (const lv of leaves) {
    const uid = lv.extendedProps!.leaveUserId as string;
    if (!byUser.has(uid)) byUser.set(uid, []);
    byUser.get(uid)!.push(lv);
  }

  const merged: EventInput[] = [];

  for (const [, userLeaves] of byUser) {
    // 날짜순 정렬
    userLeaves.sort((a, b) => String(a.start).localeCompare(String(b.start)));

    // 같은 날 중복 체크
    const dateCounts = new Map<string, number>();
    for (const lv of userLeaves) {
      const d = String(lv.start);
      dateCounts.set(d, (dateCounts.get(d) || 0) + 1);
    }

    let chain: EventInput[] = [];

    const flush = () => {
      if (chain.length === 0) return;
      if (chain.length === 1) {
        merged.push(chain[0]);
      } else {
        // 멀티데이로 합침
        const first = chain[0];
        const last = chain[chain.length - 1];
        merged.push({
          id: `leave-block-${first.extendedProps!.leaveUserId}-${first.start}`,
          title: String(first.title),
          start: String(first.start),
          end: String(last.end),
          color: String(first.color),
          extendedProps: {
            ...first.extendedProps,
            originalIds: chain.map(c => c.id),
          },
        });
      }
      chain = [];
    };

    for (let i = 0; i < userLeaves.length; i++) {
      const lv = userLeaves[i];
      const d = String(lv.start);

      // 같은 날 2건 이상 → 단독 처리
      if ((dateCounts.get(d) || 0) > 1) {
        flush();
        merged.push(lv);
        continue;
      }

      if (chain.length === 0) {
        chain.push(lv);
      } else {
        // 인접 여부: 이전 이벤트의 end === 현재 이벤트의 start
        const prevEnd = String(chain[chain.length - 1].end);
        if (prevEnd === d) {
          chain.push(lv);
        } else {
          flush();
          chain.push(lv);
        }
      }
    }
    flush();
  }

  const result = [...others, ...merged];
  console.log(`[PoC] mergeConsecutiveLeave: ${leaves.length} leaves → ${merged.length} events`);
  return result;
}

export default function CalendarPocPage() {
  const [firestoreEvents, setFirestoreEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'seed' | 'firestore' | 'both'>('both');

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

  const rawEvents = source === 'seed' ? SEED_EVENTS
    : source === 'firestore' ? firestoreEvents
    : [...SEED_EVENTS, ...firestoreEvents];

  // 연차 전처리 적용
  const allEvents = mergeConsecutiveLeave(rawEvents);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: '#2C1810', marginBottom: 12 }}>
        FullCalendar PoC v2 — 멀티데이 row 정렬 검증
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
        eventOrder="-duration,start,title"
        eventOrderStrict={true}
        dayMaxEvents={3}
        height="auto"
      />

      <div style={{ marginTop: 16, fontSize: 11, color: '#9E8880' }}>
        <p>eventOrder: -duration,start,title (긴 이벤트 위 강제)</p>
        <p>eventOrderStrict: true</p>
        <p>mergeConsecutiveLeave: 동일 userId 연차 연속 블록 → 멀티데이 변환</p>
      </div>
    </div>
  );
}

function addOneDayStr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
