'use client';

import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { LeaveEvent, LeaveType, useLeaveStore } from '@/store/leaveStore';
import { useUserStore } from '@/store/userStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import { useEscClose } from '@/hooks/useEscClose';

const HOLIDAYS_2026: Record<string, string> = {
  '2026-01-01':'신정','2026-01-28':'설날연휴','2026-01-29':'설날연휴','2026-01-30':'설날연휴',
  '2026-03-01':'삼일절','2026-05-05':'어린이날','2026-05-15':'부처님오신날','2026-06-06':'현충일',
  '2026-08-15':'광복절','2026-09-24':'추석연휴','2026-09-25':'추석연휴','2026-09-26':'추석연휴',
  '2026-10-03':'개천절','2026-10-09':'한글날','2026-12-25':'크리스마스',
};

const COLORS = ['#81D8D0','#F4C0D1','#B5D4F4','#C0DD97','#FAC775','#F0997B','#AFA9EC','#D3D1C7'];

const getEventColor = (taskType?: string, visibility?: string): string => {
  if (taskType === 'work' || !taskType) {
    if (!visibility || visibility === 'all') return '#3B6D11';
    if (visibility === 'me') return '#185FA5';
    return '#854F0B';
  }
  // personal
  if (!visibility || visibility === 'all') return '#639922';
  if (visibility === 'me') return '#378ADD';
  return '#BA7517';
};

const isPersonal = (color: string) =>
  color === '#639922' || color === '#378ADD' || color === '#BA7517';

const isLeave = (color: string) => color === '#534AB7';
const isRequest = (color: string) => color === '#993556';

const DAY_NAMES = ['일','월','화','수','목','금','토'];
const DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];
const KOREAN_DAYS = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  authorId: string;
  color: string;
  createdAt: any;
  authorName?: string;
  repeatGroupId?: string;
  requestId?: string;
  requestFrom?: string;
  requestTitle?: string;
}

interface CalendarDisplayEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  authorName?: string;
  authorId?: string;
  source: 'calendar' | 'leave';
  rawCalendar?: CalendarEvent;
  rawLeave?: any;
  isSegmentStart?: boolean;
  isSegmentEnd?: boolean;
  isSingleSegment?: boolean;
  displayTitle?: string;
}

function toDS(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function getMatrix(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const matrix: (Date | null)[][] = [];
  let day = 1 - first.getDay();
  while (day <= last.getDate()) {
    const week: (Date | null)[] = [];
    for (let i = 0; i < 7; i++, day++) {
      week.push(day < 1 || day > last.getDate() ? null : new Date(year, month, day));
    }
    matrix.push(week);
  }
  return matrix;
}

const MAX_VISIBLE_ROWS = 3;

/** 주(week) 단위 row 배정 — 멀티데이 row 고정 + 정렬 우선순위 적용 */
function assignWeekRows(
  week: (Date | null)[],
  getEventsForDay: (date: Date) => CalendarDisplayEvent[],
): Map<string, Map<string, number>> {
  // dayStr → eventId → row
  const dayRowMap = new Map<string, Map<string, number>>();
  // eventId → 고정 row (멀티데이 span 전체 유지용)
  const pinnedRow = new Map<string, number>();

  // 1) 이 주에 등장하는 모든 이벤트 수집 (중복 제거)
  const seen = new Set<string>();
  const allEvents: { ev: CalendarDisplayEvent; days: string[] }[] = [];

  const weekDates: string[] = [];
  for (const date of week) {
    if (!date) { weekDates.push(''); continue; }
    const ds = toDS(date);
    weekDates.push(ds);
    const dayEvs = getEventsForDay(date);
    for (const ev of dayEvs) {
      if (!seen.has(ev.id)) {
        seen.add(ev.id);
        // 이 주 내에서 이 이벤트가 차지하는 날들
        const days: string[] = [];
        for (const d of week) {
          if (!d) continue;
          const dds = toDS(d);
          if (ev.startDate <= dds && ev.endDate >= dds) days.push(dds);
        }
        allEvents.push({ ev, days });
      }
    }
  }

  // 2) 정렬: 단일 이벤트 위 → 멀티데이 아래, 같은 그룹 내 createdAt 최신순
  allEvents.sort((a, b) => {
    const aMulti = a.ev.startDate !== a.ev.endDate ? 1 : 0;
    const bMulti = b.ev.startDate !== b.ev.endDate ? 1 : 0;
    if (aMulti !== bMulti) return bMulti - aMulti; // 멀티(1) 위, 단일(0) 아래

    // 같은 그룹 내: span 긴 것 우선 (멀티데이끼리)
    const aSpan = a.days.length;
    const bSpan = b.days.length;
    if (aSpan !== bSpan) return bSpan - aSpan;

    // createdAt 비교 (최신이 위)
    const aTime = a.ev.rawCalendar?.createdAt?.toMillis?.() || a.ev.rawCalendar?.createdAt?.seconds * 1000 || 0;
    const bTime = b.ev.rawCalendar?.createdAt?.toMillis?.() || b.ev.rawCalendar?.createdAt?.seconds * 1000 || 0;
    return bTime - aTime;
  });

  // 3) row 배정
  for (const { ev, days } of allEvents) {
    // 이미 이전 주에서 핀된 경우 (이 로직에서는 주 단위라 해당 없지만 안전장치)
    let row = pinnedRow.get(ev.id);

    if (row === undefined) {
      // 이 이벤트가 차지하는 모든 날에서 사용 가능한 공통 row 찾기
      row = -1;
      for (let r = 0; r < MAX_VISIBLE_ROWS; r++) {
        let available = true;
        for (const ds of days) {
          const dayMap = dayRowMap.get(ds);
          if (dayMap) {
            for (const [, usedRow] of dayMap) {
              if (usedRow === r) { available = false; break; }
            }
          }
          if (!available) break;
        }
        if (available) { row = r; break; }
      }
      if (row === -1) continue; // 3개 초과 — 더보기로 처리
    }

    pinnedRow.set(ev.id, row);
    for (const ds of days) {
      if (!dayRowMap.has(ds)) dayRowMap.set(ds, new Map());
      dayRowMap.get(ds)!.set(ev.id, row);
    }
  }

  return dayRowMap;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function addYears(date: Date, n: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + n);
  return d;
}

function getPrevDateStr(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return toDS(d);
}

function getNextDateStr(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return toDS(d);
}

export default function Calendar() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { settings: leaveSettings, events: leaveEvents, addLeaveEvent, updateLeaveEvent, deleteLeaveEvent } = useLeaveStore();
  const { users } = useUserStore();
  const { requests } = useTodoRequestStore();
  const currentAppUser = users.find((u) => u.email === user?.email);
  const leaveViewPermission = currentAppUser?.leaveViewPermission;
  const canSelectLeaveTarget = user?.role === 'admin' || leaveViewPermission === 'all';
  const todayStr = toDS(new Date());

  const [cur, setCur] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [editYear, setEditYear] = useState(false);
  const [editMonth, setEditMonth] = useState(false);
  const [navYear, setNavYear] = useState(cur.year.toString());
  const [navMonth, setNavMonth] = useState(String(cur.month + 1).padStart(2, '0'));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<CalendarEvent | null>(null);
  const [showLeaveDetail, setShowLeaveDetail] = useState<any | null>(null);
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', color: COLORS[0] });
  const [addMode, setAddMode] = useState<'calendar' | 'leave'>('calendar');
  const [leaveTargetUserId, setLeaveTargetUserId] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('full');
  const [leaveMemo, setLeaveMemo] = useState('');
  const [repeatType, setRepeatType] = useState<'none'|'daily'|'weekly'|'monthly'|'yearly'>('none');
  const [weeklyDay, setWeeklyDay] = useState('');
  const [excludeHolidays, setExcludeHolidays] = useState(true);
  const [endType, setEndType] = useState<'forever'|'date'|'count'>('forever');
  const [endDate, setEndDate] = useState('');
  const [endCount, setEndCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const ignoreNextClickRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'single' | 'repeat' | 'leave';
    target: CalendarEvent | LeaveEvent;
  } | null>(null);
  const [showMoreDate, setShowMoreDate] = useState<string | null>(null);

  const anyModalOpen = showAdd || !!showDetail || !!showLeaveDetail || !!deleteConfirm || !!showMoreDate;
  useEscClose(() => {
    if (showMoreDate) { setShowMoreDate(null); return; }
    if (deleteConfirm) { setDeleteConfirm(null); return; }
    if (showLeaveDetail) { setShowLeaveDetail(null); return; }
    if (showDetail) { setShowDetail(null); return; }
    if (showAdd) { setShowAdd(false); return; }
  }, anyModalOpen);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'calendarEvents'), orderBy('startDate'));
    return onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as CalendarEvent)));
    });
  }, []);

  const moveMonth = (diff: number) => {
    setCur(c => {
      let m = c.month + diff, y = c.year;
      while (m < 0) { m += 12; y--; }
      while (m > 11) { m -= 12; y++; }
      setNavYear(y.toString());
      setNavMonth(String(m + 1).padStart(2, '0'));
      return { year: y, month: m };
    });
  };

  const applyYearInput = () => {
    const y = parseInt(navYear, 10);
    if (!isNaN(y) && y > 1900 && y < 2100) setCur(c => ({ ...c, year: y }));
    else setNavYear(cur.year.toString());
    setEditYear(false);
  };

  const applyMonthInput = () => {
    const m = parseInt(navMonth, 10);
    if (!isNaN(m) && m >= 1 && m <= 12) setCur(c => ({ ...c, month: m - 1 }));
    else setNavMonth(String(cur.month + 1).padStart(2, '0'));
    setEditMonth(false);
  };

  const canEditCalendar = (ev: CalendarEvent) =>
    !!(user && (user.role === 'admin' || user.uid === ev.authorId));

  const canEditLeave = (ev: any) => {
    if (!user) return false;
    const isAdmin = user.role === 'admin';
    const isOwner = user.email && ev.userEmail === user.email;
    const isCreator = user.email && ev.createdBy === user.email;
    const isPast = new Date(ev.date + 'T00:00:00') <= new Date(new Date().toDateString());
    if (isAdmin) return true;
    if (isPast || ev.confirmed) return false;
    return !!(isOwner || isCreator);
  };

  const getEventsForDay = (date: Date): CalendarDisplayEvent[] => {
    const ds = toDS(date);
    const normalEvents = events
      .filter(ev => ev.startDate <= ds && ev.endDate >= ds)
      .map((ev) => ({
        id: ev.id,
        title: ev.title,
        startDate: ev.startDate,
        endDate: ev.endDate,
        color: ev.color || '#C17B6B',
        authorName: ev.authorName,
        authorId: ev.authorId,
        source: 'calendar' as const,
        rawCalendar: ev,
      }));

    const leaveBlocks = leaveEvents
      .filter((ev: any) => ev.date === ds)
      .map((ev: any) => {
        const isHalf = ev.type === 'half_am' || ev.type === 'half_pm';
        const typeLabel = ev.type === 'full' ? '연차' : (ev.type === 'half_am' ? '오전반차' : '오후반차');
        const currentDate = new Date(ev.date + 'T00:00:00');
        const prevDateStr = getPrevDateStr(currentDate);
        const nextDateStr = getNextDateStr(currentDate);

        const hasPrev = leaveEvents.some((e: any) =>
          e.userId === ev.userId &&
          e.date === prevDateStr
        );

        const hasNext = leaveEvents.some((e: any) =>
          e.userId === ev.userId &&
          e.date === nextDateStr
        );

        const isStart = !hasPrev;
        const isEnd = !hasNext;
        const isSingle = isStart && isEnd;

        return {
          id: ev.id,
          title: (ev.userName || '직원') + ' ' + typeLabel + (ev.confirmed ? ' 🔒' : ''),
          startDate: ev.date,
          endDate: ev.date,
          color: '#534AB7',
          authorName: ev.createdBy,
          source: 'leave' as const,
          rawLeave: ev,
          isSegmentStart: isStart,
          isSegmentEnd: isEnd,
          isSingleSegment: isSingle,
          displayTitle: isStart || isSingle ? ((ev.userName || '직원') + ' ' + typeLabel + (ev.confirmed ? ' 🔒' : '')) : '\u00A0',
        };
      });

    return [...normalEvents, ...leaveBlocks];
  };

  // 반복 날짜 생성 (핵심 로직)
  const buildRepeatDates = (startStr: string): string[] => {
    const start = new Date(startStr + 'T00:00:00');
    const results: string[] = [];

    // 종료 기준 계산
    let limitDate: Date;
    if (repeatType === 'none') return [startStr];
    if (endType === 'date' && endDate) {
      limitDate = new Date(endDate + 'T00:00:00');
    } else {
      // forever 또는 count: 1년치 상한
      limitDate = new Date(start);
      limitDate.setFullYear(limitDate.getFullYear() + 1);
    }

    const maxItems = endType === 'count' ? endCount : 500;
    let d = new Date(start);

    while (d <= limitDate && results.length < maxItems) {
      const ds = toDS(d);
      let shouldAdd = false;

      if (repeatType === 'daily') {
        shouldAdd = true;
        d = addDays(d, 1);
      } else if (repeatType === 'weekly') {
        const dayKey = DAY_KEYS[d.getDay()];
        if (dayKey === weeklyDay) shouldAdd = true;
        d = addDays(d, 1);
      } else if (repeatType === 'monthly') {
        shouldAdd = true;
        d = addMonths(d, 1);
      } else if (repeatType === 'yearly') {
        shouldAdd = true;
        d = addYears(d, 1);
      }

      if (shouldAdd) {
        if (excludeHolidays && HOLIDAYS_2026[ds]) continue;
        results.push(ds);
      }

      // 무한루프 방지
      if (results.length >= 500) break;
    }

    return results;
  };

  const openAddModal = (startStr: string, endStr: string) => {
    const d = new Date(startStr + 'T00:00:00');
    setSelectedStartDate(startStr);
    setSelectedEndDate(endStr);
    setWeeklyDay(DAY_KEYS[d.getDay()]);
    setForm({ title: '', startDate: startStr, endDate: endStr, color: getEventColor(), _taskType: 'work', _visibility: 'all' } as any);
    setAddMode('calendar');
    setLeaveTargetUserId(currentAppUser?.id || '');
    setLeaveType('full');
    setLeaveMemo('');
    setRepeatType('none');
    setEndType('forever');
    setEndDate('');
    setEndCount(10);
    setExcludeHolidays(true);
    setShowAdd(true);
  };

  const syncRangeToForm = (startStr: string, endStr: string) => {
    setForm((f) => ({ ...f, startDate: startStr, endDate: endStr }));
  };

  const buildDateRange = (startStr: string, endStr: string): string[] => {
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    const s = start <= end ? start : end;
    const e = start <= end ? end : start;
    const result: string[] = [];
    let cursor = new Date(s);
    while (cursor <= e) {
      result.push(toDS(cursor));
      cursor = addDays(cursor, 1);
    }
    return result;
  };

  const handleAdd = async () => {
    if (addMode === 'leave') {
      const rangeStart = selectedStartDate || form.startDate;
      const rangeEnd = selectedEndDate || form.endDate || form.startDate;
      if (!rangeStart || !user) return;

      const effectiveTargetUserId = canSelectLeaveTarget ? leaveTargetUserId : (currentAppUser?.id || '');
      if (!effectiveTargetUserId) return;

      const target = users.find((u) => u.id === effectiveTargetUserId);
      if (!target) return;
      const isAdmin = user.role === 'admin';
      const isSelf = user.email && user.email === target.email;
      if (!isAdmin && !isSelf) {
        addToast('본인 또는 관리자만 연차를 등록할 수 있습니다.');
        return;
      }

      setLoading(true);
      try {
        const dates = buildDateRange(rangeStart, rangeEnd);
        for (const ds of dates) {
          await addLeaveEvent({
            userId: target.id,
            userName: target.name,
            userEmail: target.email,
            date: ds,
            type: leaveType,
            days: leaveType === 'full' ? 1 : 0.5,
            memo: leaveMemo,
            createdBy: user.email || '',
          });
        }
        addToast(dates.length + '일 연차가 등록되었습니다.');
        setShowAdd(false);
      } catch (e) {
        addToast('연차 등록 실패');
      }
      setLoading(false);
      return;
    }

    if (!form.title.trim() || !form.startDate || !form.endDate) return;
    setLoading(true);
    try {
      if (repeatType === 'none') {
        await addDoc(collection(db, 'calendarEvents'), {
          title: form.title, startDate: form.startDate, endDate: form.endDate,
          authorId: user?.uid, authorName: user?.displayName || user?.email,
          color: form.color, createdAt: new Date(), repeat: { type: 'none' },
        });
        addToast('일정이 추가되었습니다.');
      } else {
        const dates = buildRepeatDates(form.startDate);
        if (dates.length === 0) { addToast('생성할 일정이 없습니다.'); setLoading(false); return; }
        const groupId = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        for (const ds of dates) {
          await addDoc(collection(db, 'calendarEvents'), {
            title: form.title, startDate: ds, endDate: ds,
            authorId: user?.uid, authorName: user?.displayName || user?.email,
            color: form.color, createdAt: new Date(),
            repeat: { type: repeatType, weeklyDay, excludeHolidays, endType, endDate, endCount },
            repeatGroupId: groupId,
          });
        }
        addToast(dates.length + '개 일정이 추가되었습니다.');
      }
      setShowAdd(false);
    } catch (e) { addToast('추가 실패'); }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!showDetail || !form.title.trim()) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'calendarEvents', showDetail.id), {
        title: form.title, startDate: form.startDate, endDate: form.endDate, color: form.color,
      });
      setShowDetail(null);
      addToast('수정되었습니다.');
    } catch (e) { addToast('수정 실패'); }
    setLoading(false);
  };

  const handleLeaveUpdate = async () => {
    if (!showLeaveDetail || !form.startDate) return;
    if (!canEditLeave(showLeaveDetail)) return;
    setLoading(true);
    try {
      await updateLeaveEvent(showLeaveDetail.id, {
        date: form.startDate,
        type: leaveType,
        days: leaveType === 'full' ? 1 : 0.5,
        memo: leaveMemo,
      });
      setShowLeaveDetail(null);
      addToast('연차가 수정되었습니다.');
    } catch (e) {
      addToast('연차 수정 실패');
    }
    setLoading(false);
  };

  const handleDeleteSingle = async (ev: CalendarEvent) => {
    setDeleteConfirm({ type: 'single', target: ev });
  };

  const executeDeleteSingle = async (ev: CalendarEvent) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'calendarEvents', ev.id));
      setShowDetail(null);
      addToast('삭제되었습니다.');
    } catch (e) { addToast('삭제 실패'); }
    setLoading(false);
  };

  const handleDeleteRepeat = async (ev: CalendarEvent) => {
    if (!ev.repeatGroupId) return;
    setDeleteConfirm({ type: 'repeat', target: ev });
  };

  const executeDeleteRepeat = async (ev: CalendarEvent) => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'calendarEvents'));
      const toDelete = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(e => e.repeatGroupId === ev.repeatGroupId && e.startDate >= ev.startDate);
      for (const e of toDelete) await deleteDoc(doc(db, 'calendarEvents', e.id));
      setShowDetail(null);
      addToast(toDelete.length + '개 삭제되었습니다.');
    } catch (e) { addToast('삭제 실패'); }
    setLoading(false);
  };

  const handleLeaveDelete = async (ev: any) => {
    if (!canEditLeave(ev)) return;
    setDeleteConfirm({ type: 'leave', target: ev });
  };

  const executeLeaveDelete = async (ev: any) => {
    setLoading(true);
    try {
      await deleteLeaveEvent(ev.id);
      setShowLeaveDetail(null);
      addToast('연차가 삭제되었습니다.');
    } catch (e) {
      addToast('연차 삭제 실패');
    }
    setLoading(false);
  };

  const openDisplayEvent = (ev: CalendarDisplayEvent) => {
    setForm({ title: ev.title, startDate: ev.startDate, endDate: ev.endDate, color: ev.color });
    if (ev.source === 'calendar' && ev.rawCalendar) {
      setShowLeaveDetail(null);
      setShowDetail(ev.rawCalendar);
      return;
    }
    if (ev.source === 'leave' && ev.rawLeave) {
      setShowDetail(null);
      setShowLeaveDetail(ev.rawLeave);
      setLeaveType(ev.rawLeave.type || 'full');
      setLeaveMemo(ev.rawLeave.memo || '');
    }
  };

  // 드래그
  const onMouseDown = (date: Date) => {
    setDragStart(date);
    setDragEnd(date);
    setIsDragging(true);
    ignoreNextClickRef.current = false;
  };
  const onMouseEnter = (date: Date) => { if (isDragging) setDragEnd(date); };
  const onMouseUp = () => {
    if (dragStart && dragEnd) {
      const s = dragStart <= dragEnd ? dragStart : dragEnd;
      const e = dragStart <= dragEnd ? dragEnd : dragStart;
      if (toDS(s) !== toDS(e)) {
        ignoreNextClickRef.current = true;
      }
      openAddModal(toDS(s), toDS(e));
    }
    setIsDragging(false); setDragStart(null); setDragEnd(null);
  };

  const isDragSel = (date: Date) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    const s = dragStart <= dragEnd ? dragStart : dragEnd;
    const e = dragStart <= dragEnd ? dragEnd : dragStart;
    return date >= s && date <= e;
  };

  let nextY = cur.year, nextM = cur.month + 1;
  if (nextM > 11) { nextM = 0; nextY++; }

  const renderMonth = (matrix: (Date | null)[][], year: number, month: number) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#2C1810', marginBottom: 8, letterSpacing: '0.05em' }}>
        {year}년 {month + 1}월
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderTop: '0.5px solid #EDE5DC', borderLeft: '0.5px solid #EDE5DC' }}>
        {DAY_NAMES.map((d, i) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, padding: '6px 0', color: i === 0 ? '#C17B6B' : i === 6 ? '#6B8BC1' : '#9E8880', borderRight: '0.5px solid #EDE5DC', borderBottom: '0.5px solid #EDE5DC', background: '#FDF8F4' }}>
            {d}
          </div>
        ))}
        {matrix.map((week, wi) => {
          const weekRowMap = assignWeekRows(week, getEventsForDay);
          return week.map((date, di) => {
          if (!date) return (
            <div key={wi + '-' + di} style={{ minHeight: 72, borderRight: '0.5px solid #EDE5DC', borderBottom: '0.5px solid #EDE5DC', background: '#FAFAF8' }} />
          );
          const ds = toDS(date);
          const isToday = ds === todayStr;
          const isHol = !!HOLIDAYS_2026[ds];
          const isSun = di === 0, isSat = di === 6;
          const dayEvs = getEventsForDay(date);
          const dayRows = weekRowMap.get(ds);
          const dragSelected = isDragSel(date);
          return (
            <div
              key={wi + '-' + di}
              onMouseDown={(e) => {
                e.preventDefault();
                onMouseDown(date);
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const target = e.target as HTMLElement;
                const clickedEvent = target.closest('[data-event="true"]');
                if (clickedEvent) {
                  setIsDragging(false);
                  setDragStart(null);
                  setDragEnd(null);
                  return;
                }
                if (dragStart && dragEnd) {
                  const s = dragStart <= dragEnd ? dragStart : dragEnd;
                  const e2 = dragStart <= dragEnd ? dragEnd : dragStart;
                  if (toDS(s) !== toDS(e2)) {
                    ignoreNextClickRef.current = true;
                  }
                  openAddModal(toDS(s), toDS(e2));
                }
                setIsDragging(false);
                setDragStart(null);
                setDragEnd(null);
              }}
              onClick={(e) => {
                if (ignoreNextClickRef.current) {
                  ignoreNextClickRef.current = false;
                  return;
                }
                const target = e.target as HTMLElement;
                if (target.closest('[data-event="true"]')) return;
                setSelectedStartDate(ds);
                setSelectedEndDate(ds);
                openAddModal(ds, ds);
              }}
              onMouseEnter={() => {
                onMouseEnter(date);
                if (!isDragging) setHoveredDate(ds);
              }}
              onMouseLeave={() => setHoveredDate(null)}
              style={{ minHeight: 72, borderRight: '0.5px solid #EDE5DC', borderBottom: '0.5px solid #EDE5DC', padding: '4px 3px', cursor: 'pointer', background: dragSelected ? '#FFF5F2' : isToday ? '#FFFAF7' : hoveredDate === ds ? '#F5EDE6' : '#fff', userSelect: 'none' }}
            >
              <div style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? '#C17B6B' : isHol || isSun ? '#C17B6B' : isSat ? '#6B8BC1' : '#2C1810', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: isToday ? '50%' : 0, background: isToday ? '#F5E6E0' : 'transparent', marginBottom: 2 }}>
                {date.getDate()}
              </div>
              {isHol && <div style={{ fontSize: 9, color: '#C17B6B', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginBottom: 1 }}>{HOLIDAYS_2026[ds]}</div>}
              {(() => {
                // row 기반 렌더링: 0,1,2 순서로 출력, 빈 row는 placeholder
                const evById = new Map(dayEvs.map(ev => [ev.id, ev]));
                const rowSlots: (CalendarDisplayEvent | null)[] = [];
                for (let r = 0; r < MAX_VISIBLE_ROWS; r++) {
                  let found: CalendarDisplayEvent | null = null;
                  if (dayRows) {
                    for (const [eid, row] of dayRows) {
                      if (row === r && evById.has(eid)) { found = evById.get(eid)!; break; }
                    }
                  }
                  rowSlots.push(found);
                }
                return rowSlots.map((ev, r) => {
                  if (!ev) return <div key={'empty-' + r} style={{ height: 15, marginBottom: 1 }} />;
                  const isSingle = ev.source === 'leave' ? !!ev.isSingleSegment : ev.startDate === ev.endDate;
                  const isStart = ev.source === 'leave' ? !!ev.isSegmentStart : ev.startDate === ds;
                  const isEnd = ev.source === 'leave' ? !!ev.isSegmentEnd : ev.endDate === ds;
                  return (
                    <div key={ev.id} data-event="true" onClick={e => {
                      e.stopPropagation();
                      openDisplayEvent(ev);
                    }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                      style={(() => {
                        const col = ev.color || '#3B6D11';
                        const personal = isPersonal(col);
                        const leave = isLeave(col);
                        const request = isRequest(col);
                        const bgColor = personal
                          ? col === '#639922' ? 'rgba(99,153,34,0.15)'
                            : col === '#378ADD' ? 'rgba(55,138,221,0.15)'
                            : 'rgba(186,117,23,0.15)'
                          : leave ? 'rgba(83,74,183,0.15)'
                          : col;
                        const textColor = personal
                          ? col === '#639922' ? '#3B6D11'
                            : col === '#378ADD' ? '#185FA5'
                            : '#854F0B'
                          : leave ? '#3C3489'
                          : '#fff';
                        const borderLeft = isStart || isSingle
                          ? personal
                            ? `2px solid ${col}`
                            : leave ? '2px solid #534AB7'
                            : request ? '3px solid #72243E'
                            : 'none'
                          : 'none';
                        return {
                          fontSize: 10,
                          color: textColor,
                          background: bgColor,
                          cursor: 'pointer',
                          padding: '1px 4px',
                          marginBottom: 1,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap' as const,
                          textOverflow: 'ellipsis',
                          borderRadius: isSingle ? 3 : isStart ? '3px 0 0 3px' : isEnd ? '0 3px 3px 0' : 0,
                          marginLeft: isStart || isSingle ? 0 : -4,
                          marginRight: isEnd || isSingle ? 0 : -4,
                          paddingLeft: isStart || isSingle ? 4 : 0,
                          paddingRight: isEnd || isSingle ? 4 : 0,
                          borderLeft,
                        };
                      })()}>
                      {ev.source === 'leave' ? (ev.displayTitle || '\u00A0') : (isStart || isSingle ? ev.title : '\u00A0')}
                    </div>
                  );
                });
              })()}
              {dayEvs.length > MAX_VISIBLE_ROWS && (
                <div
                  data-event="true"
                  onClick={e => { e.stopPropagation(); setShowMoreDate(ds); }}
                  style={{ fontSize: 9, color: '#C17B6B', cursor: 'pointer', padding: '1px 2px' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#7A2828'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#C17B6B'; }}
                >
                  +{dayEvs.length - MAX_VISIBLE_ROWS} 더보기
                </div>
              )}
            </div>
          );
        });
        })}
      </div>
    </div>
  );

  const startDayOfWeek = form.startDate ? KOREAN_DAYS[new Date(form.startDate + 'T00:00:00').getDay()] : '';

  return (
    <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%' }} onMouseUp={onMouseUp}>

      {/* 네비게이션 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '12px 20px', borderBottom: '1px solid #EDE5DC' }}>
        <button onClick={() => moveMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E8880', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>‹</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {editYear ? (
            <input value={navYear} onChange={e => setNavYear(e.target.value.replace(/\D/g,''))} onBlur={applyYearInput} onKeyDown={e => e.key === 'Enter' && applyYearInput()} autoFocus style={{ width: 52, border: 'none', borderBottom: '1px solid #C17B6B', textAlign: 'center', fontSize: 14, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
          ) : (
            <span onClick={() => setEditYear(true)} style={{ fontSize: 14, fontWeight: 700, color: '#2C1810', cursor: 'pointer', letterSpacing: '0.04em' }}>{cur.year}년</span>
          )}
          {editMonth ? (
            <input value={navMonth} onChange={e => setNavMonth(e.target.value.replace(/\D/g,''))} onBlur={applyMonthInput} onKeyDown={e => e.key === 'Enter' && applyMonthInput()} autoFocus style={{ width: 36, border: 'none', borderBottom: '1px solid #C17B6B', textAlign: 'center', fontSize: 14, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
          ) : (
            <span onClick={() => setEditMonth(true)} style={{ fontSize: 14, fontWeight: 700, color: '#2C1810', cursor: 'pointer' }}>{String(cur.month + 1).padStart(2,'0')}월</span>
          )}
        </div>
        <button onClick={() => moveMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E8880', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>›</button>
      </div>

      {/* 달력 본체 */}
      <div style={{ display: 'flex', gap: 0 }}>
        <div style={{ flex: 1, padding: '12px 8px', borderRight: isMobile ? 'none' : '1px solid #EDE5DC' }}>
          {renderMonth(getMatrix(cur.year, cur.month), cur.year, cur.month)}
        </div>
        {!isMobile && (
          <div style={{ flex: 1, padding: '12px 8px' }}>
            {renderMonth(getMatrix(nextY, nextM), nextY, nextM)}
          </div>
        )}
      </div>

      {/* 일정 추가 모달 */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE5DC', position: 'sticky', top: 0, background: '#fff' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>일정 추가</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                <button
                  onClick={() => {
                    setAddMode('calendar');
                    syncRangeToForm(selectedStartDate || form.startDate, selectedEndDate || form.endDate || form.startDate);
                  }}
                  style={{ padding: '5px 10px', border: '1px solid ' + (addMode === 'calendar' ? '#2C1810' : '#EDE5DC'), background: addMode === 'calendar' ? '#FDF8F4' : '#fff', color: addMode === 'calendar' ? '#2C1810' : '#9E8880', fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  일반 일정
                </button>
                <button
                  onClick={() => {
                    setAddMode('leave');
                    const s = selectedStartDate || form.startDate;
                    const e = selectedEndDate || form.endDate || form.startDate;
                    syncRangeToForm(s, e);
                  }}
                  style={{ padding: '5px 10px', border: '1px solid ' + (addMode === 'leave' ? '#2C1810' : '#EDE5DC'), background: addMode === 'leave' ? '#FDF8F4' : '#fff', color: addMode === 'leave' ? '#2C1810' : '#9E8880', fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  연차 등록
                </button>
              </div>

              {addMode === 'calendar' ? (
                <>

              {/* 제목 */}
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="일정 제목" style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', marginBottom: 16, fontFamily: 'inherit' }} />

              {/* 날짜 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>날짜</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="date" value={form.startDate} onChange={e => { setForm(f => ({ ...f, startDate: e.target.value })); const d = new Date(e.target.value + 'T00:00:00'); setWeeklyDay(DAY_KEYS[d.getDay()]); }}
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
                  <span style={{ color: '#9E8880' }}>~</span>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
                </div>
              </div>

              {/* 반복 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>반복</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['none','daily','weekly','monthly','yearly'] as const).map(t => {
                    const labels = { none: '안함', daily: '매일', weekly: '매주', monthly: '매월', yearly: '매년' };
                    return (
                      <button key={t} onClick={() => {
                        setRepeatType(t);
                        if (t === 'weekly' && form.startDate) {
                          const d = new Date(form.startDate + 'T00:00:00');
                          setWeeklyDay(DAY_KEYS[d.getDay()]);
                        }
                      }}
                        style={{ padding: '5px 10px', border: '1px solid ' + (repeatType === t ? '#C17B6B' : '#EDE5DC'), background: repeatType === t ? '#FFF5F2' : '#fff', color: repeatType === t ? '#C17B6B' : '#9E8880', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                        {labels[t]}
                      </button>
                    );
                  })}
                </div>

                {repeatType === 'weekly' && weeklyDay && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#9E8880' }}>
                    매주 {KOREAN_DAYS[DAY_KEYS.indexOf(weeklyDay)]} 반복
                  </div>
                )}

                {repeatType !== 'none' && (
                  <div style={{ marginTop: 12 }}>
                    {/* 공휴일 제외 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: '#9E8880' }}>공휴일 제외</span>
                      <div onClick={() => setExcludeHolidays(v => !v)}
                        style={{ width: 32, height: 18, background: excludeHolidays ? '#C17B6B' : '#EDE5DC', borderRadius: 9, position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: 2, left: excludeHolidays ? 14 : 2, width: 14, height: 14, background: '#fff', borderRadius: '50%', transition: 'left .2s' }} />
                      </div>
                    </div>
                    {/* 종료 방식 */}
                    <div style={{ fontSize: 10, color: '#9E8880', marginBottom: 6 }}>종료</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      {(['forever','date','count'] as const).map(t => {
                        const labels = { forever: '무기한', date: '날짜 지정', count: '횟수 지정' };
                        return (
                          <button key={t} onClick={() => setEndType(t)}
                            style={{ padding: '4px 8px', border: '1px solid ' + (endType === t ? '#2C1810' : '#EDE5DC'), background: endType === t ? '#FDF8F4' : '#fff', color: endType === t ? '#2C1810' : '#9E8880', fontSize: 10, cursor: 'pointer' }}>
                            {labels[t]}
                          </button>
                        );
                      })}
                    </div>
                    {endType === 'date' && (
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                        style={{ border: 'none', borderBottom: '1px solid #EDE5DC', padding: '4px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
                    )}
                    {endType === 'count' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="number" value={endCount} min={1} max={200} onChange={e => setEndCount(Math.max(1, parseInt(e.target.value) || 1))}
                          style={{ width: 60, border: 'none', borderBottom: '1px solid #EDE5DC', padding: '4px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', textAlign: 'center', fontFamily: 'inherit' }} />
                        <span style={{ fontSize: 11, color: '#9E8880' }}>회</span>
                      </div>
                    )}
                    {endType === 'forever' && (
                      <div style={{ fontSize: 11, color: '#C4B8B0' }}>1년치 일정이 생성됩니다</div>
                    )}
                  </div>
                )}
              </div>

              {/* 구분 선택 (업무/개인) */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>구분</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([
                    { v: 'work', label: '업무', color: '#3B6D11', bg: '#EAF3DE', border: '#639922' },
                    { v: 'personal', label: '개인', color: '#185FA5', bg: 'rgba(55,138,221,0.1)', border: '#378ADD' },
                  ] as const).map(opt => (
                    <button key={opt.v}
                      onClick={() => {
                        const vis = (form as any)._visibility || 'all';
                        setForm(f => ({ ...f, color: getEventColor(opt.v, vis), _taskType: opt.v } as any));
                      }}
                      style={{
                        padding: '5px 14px', fontSize: 10, letterSpacing: '0.06em', cursor: 'pointer',
                        border: `1px solid ${(form as any)._taskType === opt.v ? opt.border : '#EDE5DC'}`,
                        background: (form as any)._taskType === opt.v ? opt.bg : '#fff',
                        color: (form as any)._taskType === opt.v ? opt.color : '#9E8880',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 공개 범위 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>공개 범위</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([
                    { v: 'all', label: '전체', solidColor: '#3B6D11', alphaColor: 'rgba(99,153,34,0.15)', border: '#639922' },
                    { v: 'me', label: '나만', solidColor: '#185FA5', alphaColor: 'rgba(55,138,221,0.15)', border: '#378ADD' },
                    { v: 'specific', label: '지정', solidColor: '#854F0B', alphaColor: 'rgba(186,117,23,0.15)', border: '#BA7517' },
                  ] as const).map(opt => {
                    const taskType = (form as any)._taskType || 'work';
                    const isPersonalType = taskType === 'personal';
                    const active = (form as any)._visibility === opt.v;
                    return (
                      <button key={opt.v}
                        onClick={() => {
                          const taskType = (form as any)._taskType || 'work';
                          setForm(f => ({ ...f, color: getEventColor(taskType, opt.v), _visibility: opt.v } as any));
                        }}
                        style={{
                          padding: '5px 12px', fontSize: 10, letterSpacing: '0.06em', cursor: 'pointer',
                          border: `1px solid ${active ? opt.border : '#EDE5DC'}`,
                          background: active ? (isPersonalType ? opt.alphaColor : opt.alphaColor) : '#fff',
                          color: active ? opt.solidColor : '#9E8880',
                        }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 미리보기 */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>달력 표시 미리보기</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(() => {
                    const col = form.color;
                    const personal = isPersonal(col);
                    const leave = isLeave(col);
                    const request = isRequest(col);
                    const bgColor = personal
                      ? col === '#639922' ? 'rgba(99,153,34,0.15)'
                        : col === '#378ADD' ? 'rgba(55,138,221,0.15)'
                        : 'rgba(186,117,23,0.15)'
                      : leave ? 'rgba(83,74,183,0.15)'
                      : col;
                    const textColor = personal
                      ? col === '#639922' ? '#3B6D11'
                        : col === '#378ADD' ? '#185FA5'
                        : '#854F0B'
                      : leave ? '#3C3489'
                      : '#fff';
                    const borderLeft = personal
                      ? `2px solid ${col}`
                      : leave ? '2px solid #534AB7'
                      : 'none';
                    return (
                      <div style={{
                        fontSize: 10, color: textColor, background: bgColor,
                        padding: '2px 8px', borderRadius: 3, borderLeft,
                        minWidth: 80, maxWidth: 160,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      }}>
                        {form.title || '일정 제목'}
                      </div>
                    );
                  })()}
                  <span style={{ fontSize: 10, color: '#C4B8B0' }}>달력에서 이렇게 보여요</span>
                </div>
              </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>대상자</div>
                    {canSelectLeaveTarget ? (
                      <select
                        value={leaveTargetUserId}
                        onChange={(e) => setLeaveTargetUserId(e.target.value)}
                        style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }}
                      >
                        <option value="">직원 선택</option>
                        {users.filter((u) => u.role !== 'admin').map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ width: '100%', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810' }}>
                        {currentAppUser?.name || user?.displayName || user?.email || '본인'}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>날짜</div>
                    <div style={{ fontSize: 11, color: '#2C1810', borderBottom: '1px solid #EDE5DC', padding: '6px 0' }}>
                      {(selectedStartDate || form.startDate) === (selectedEndDate || form.endDate || form.startDate)
                        ? (selectedStartDate || form.startDate)
                        : `${selectedStartDate || form.startDate} ~ ${selectedEndDate || form.endDate || form.startDate}`}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>종류</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {([
                        { key: 'full', label: '전일' },
                        { key: 'half_am', label: '오전반차' },
                        { key: 'half_pm', label: '오후반차' },
                      ] as const).map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setLeaveType(t.key)}
                          style={{ padding: '5px 10px', border: '1px solid ' + (leaveType === t.key ? '#2C1810' : '#EDE5DC'), background: leaveType === t.key ? '#FDF8F4' : '#fff', color: leaveType === t.key ? '#2C1810' : '#9E8880', fontSize: 10, cursor: 'pointer' }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>메모</div>
                    <input
                      value={leaveMemo}
                      onChange={(e) => setLeaveMemo(e.target.value)}
                      placeholder="선택 입력"
                      style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }}
                    />
                  </div>
                </>
              )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', bottom: 0 }}>
              <button onClick={() => setShowAdd(false)} style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
              <button onClick={handleAdd} disabled={loading}
                style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: loading ? '#9E8880' : '#2C1810', color: '#FDF8F4', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '저장 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {showDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 380 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE5DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>일정 상세</span>
              {canEditCalendar(showDetail) && (
                <span style={{ fontSize: 10, color: '#C17B6B', letterSpacing: '0.04em' }}>✎ 편집 가능</span>
              )}
            </div>
            <div style={{ padding: '16px 20px' }}>
              {showDetail.requestId && (() => {
                const req = requests.find(r => r.id === showDetail.requestId);
                const fromUser = users.find(u => u.email === showDetail.requestFrom);
                const toUser = users.find(u => u.email === showDetail.authorId);
                const isCompleted = req?.status === 'completed';
                return (
                  <div style={{ marginBottom: 16, padding: '12px', background: '#FFF9F7', border: '1px solid #EDE5DC' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C17B6B', marginBottom: 10 }}>업무 요청 정보</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 11, color: '#9E8880', width: 44, flexShrink: 0 }}>요청자</span>
                        <span style={{ fontSize: 11, color: '#2C1810', fontWeight: 600 }}>{fromUser?.name || showDetail.requestFrom}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 11, color: '#9E8880', width: 44, flexShrink: 0 }}>담당자</span>
                        <span style={{ fontSize: 11, color: '#2C1810', fontWeight: 600 }}>
                          {showDetail.authorName?.startsWith('담당:')
                            ? showDetail.authorName.replace('담당: ', '')
                            : (toUser?.name || showDetail.authorId)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 11, color: '#9E8880', width: 44, flexShrink: 0 }}>업무</span>
                        <span style={{ fontSize: 11, color: '#2C1810' }}>{showDetail.requestTitle || showDetail.title.replace('[요청] ', '')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#9E8880', width: 44, flexShrink: 0 }}>완료</span>
                        <span style={{
                          fontSize: 9, padding: '2px 8px',
                          background: isCompleted ? '#F0F5F0' : '#FFF5F2',
                          color: isCompleted ? '#5C7A5C' : '#C17B6B',
                          border: `0.5px solid ${isCompleted ? '#5C7A5C' : '#C17B6B'}`,
                          letterSpacing: '0.06em',
                        }}>
                          {isCompleted ? '완료' : '진행중'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {canEditCalendar(showDetail) ? (
                <>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', marginBottom: 10, fontFamily: 'inherit' }} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                      style={{ flex: 1, border: 'none', borderBottom: '1px solid #EDE5DC', padding: '4px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
                    <span style={{ color: '#9E8880' }}>~</span>
                    <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                      style={{ flex: 1, border: 'none', borderBottom: '1px solid #EDE5DC', padding: '4px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#9E8880', marginTop: 8 }}>작성자: {showDetail.authorName}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#2C1810', marginBottom: 6 }}>{showDetail.title}</div>
                  <div style={{ fontSize: 11, color: '#9E8880', marginBottom: 4 }}>{showDetail.startDate} ~ {showDetail.endDate}</div>
                  <div style={{ fontSize: 11, color: '#9E8880' }}>작성자: {showDetail.authorName}</div>
                </>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <button onClick={() => setShowDetail(null)} style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>닫기</button>
              {canEditCalendar(showDetail) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {showDetail.repeatGroupId && (
                    <button onClick={() => handleDeleteRepeat(showDetail)}
                      style={{ fontSize: 10, padding: '6px 10px', border: '1px solid #C17B6B', color: '#C17B6B', background: '#fff', cursor: 'pointer' }}>
                      이후 모두 삭제
                    </button>
                  )}
                  <button onClick={() => handleDeleteSingle(showDetail)}
                    style={{ fontSize: 10, padding: '6px 10px', border: '1px solid #EDE5DC', color: '#9E8880', background: '#fff', cursor: 'pointer' }}>
                    이 일정만 삭제
                  </button>
                  <button onClick={handleUpdate} disabled={loading}
                    style={{ fontSize: 10, padding: '6px 14px', background: '#2C1810', color: '#FDF8F4', border: 'none', cursor: 'pointer' }}>
                    저장
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showLeaveDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 380 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE5DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>연차 상세</span>
              {canEditLeave(showLeaveDetail) && (
                <span style={{ fontSize: 10, color: '#C17B6B', letterSpacing: '0.04em' }}>✎ 편집 가능</span>
              )}
            </div>
            <div style={{ padding: '16px 20px' }}>
              {canEditLeave(showLeaveDetail) ? (
                <>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value, endDate: e.target.value }))}
                    style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', marginBottom: 10, fontFamily: 'inherit' }} />
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    {([
                      { key: 'full', label: '전일' },
                      { key: 'half_am', label: '오전반차' },
                      { key: 'half_pm', label: '오후반차' },
                    ] as const).map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setLeaveType(t.key)}
                        style={{ padding: '5px 8px', border: '1px solid ' + (leaveType === t.key ? '#2C1810' : '#EDE5DC'), background: leaveType === t.key ? '#FDF8F4' : '#fff', color: leaveType === t.key ? '#2C1810' : '#9E8880', fontSize: 10, cursor: 'pointer' }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <input value={leaveMemo} onChange={e => setLeaveMemo(e.target.value)}
                    style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
                  <div style={{ fontSize: 11, color: '#9E8880', marginTop: 8 }}>대상자: {showLeaveDetail.userName}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#2C1810', marginBottom: 6 }}>{showLeaveDetail.userName} 연차</div>
                  <div style={{ fontSize: 11, color: '#9E8880', marginBottom: 4 }}>{showLeaveDetail.date} / {showLeaveDetail.type === 'full' ? '전일' : showLeaveDetail.type === 'half_am' ? '오전반차' : '오후반차'} {showLeaveDetail.confirmed ? '🔒' : ''}</div>
                  <div style={{ fontSize: 11, color: '#9E8880' }}>메모: {showLeaveDetail.memo || '-'}</div>
                </>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <button onClick={() => setShowLeaveDetail(null)} style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>닫기</button>
              {canEditLeave(showLeaveDetail) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => handleLeaveDelete(showLeaveDetail)}
                    style={{ fontSize: 10, padding: '6px 10px', border: '1px solid #EDE5DC', color: '#9E8880', background: '#fff', cursor: 'pointer' }}>
                    삭제
                  </button>
                  <button onClick={handleLeaveUpdate} disabled={loading}
                    style={{ fontSize: 10, padding: '6px 14px', background: '#2C1810', color: '#FDF8F4', border: 'none', cursor: 'pointer' }}>
                    저장
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 색상 범례 */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
        {[
          { bg: '#3B6D11', border: 'none', text: '#fff', label: '업무·전체' },
          { bg: '#185FA5', border: 'none', text: '#fff', label: '업무·나만' },
          { bg: '#854F0B', border: 'none', text: '#fff', label: '업무·지정' },
          { bg: '#993556', border: 'none', text: '#fff', label: '업무요청', borderLeft: '3px solid #72243E' },
          { bg: 'rgba(99,153,34,0.15)', border: '2px solid #639922', text: '#3B6D11', label: '개인·전체' },
          { bg: 'rgba(55,138,221,0.15)', border: '2px solid #378ADD', text: '#185FA5', label: '개인·나만' },
          { bg: 'rgba(186,117,23,0.15)', border: '2px solid #BA7517', text: '#854F0B', label: '개인·지정' },
          { bg: 'rgba(83,74,183,0.15)', border: '2px solid #534AB7', text: '#3C3489', label: '연차' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 24, height: 10, borderRadius: 2,
              background: item.bg,
              border: item.border === 'none' ? 'none' : item.border,
              borderLeft: (item as any).borderLeft || (item.border === 'none' ? 'none' : item.border),
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 9, color: '#9E8880', letterSpacing: '0.04em' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 340 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE5DC' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>
                {deleteConfirm.type === 'repeat' ? '반복 일정 삭제' : deleteConfirm.type === 'leave' ? '연차 삭제' : '일정 삭제'}
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: 13, color: '#2C1810', lineHeight: 1.6 }}>
                {deleteConfirm.type === 'repeat'
                  ? '이 날짜 이후의 반복 일정을 모두 삭제할까요?'
                  : deleteConfirm.type === 'leave'
                  ? '이 연차를 삭제할까요?'
                  : '이 일정을 삭제할까요?'}
              </p>
              <p style={{ fontSize: 11, color: '#9E8880', marginTop: 4 }}>삭제된 내용은 복구할 수 없습니다.</p>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirm.type === 'single') await executeDeleteSingle(deleteConfirm.target as CalendarEvent);
                  if (deleteConfirm.type === 'repeat') await executeDeleteRepeat(deleteConfirm.target as CalendarEvent);
                  if (deleteConfirm.type === 'leave') await executeLeaveDelete(deleteConfirm.target as LeaveEvent);
                  setDeleteConfirm(null);
                }}
                disabled={loading}
                style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: '#C17B6B', color: '#FDF8F4', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMoreDate && (() => {
        const date = new Date(showMoreDate + 'T00:00:00');
        const moreEvs = getEventsForDay(date);
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70 }}
            onClick={() => setShowMoreDate(null)}>
            <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 320, maxHeight: '70vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #EDE5DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2C1810' }}>
                  {showMoreDate.replace(/-/g, '.')} 일정
                </span>
                <button onClick={() => setShowMoreDate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E8880', fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
              <div style={{ padding: '8px 0' }}>
                {moreEvs.map(ev => (
                  <div key={ev.id} onClick={() => {
                    setShowMoreDate(null);
                    openDisplayEvent(ev);
                  }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', cursor: 'pointer', borderBottom: '0.5px solid #EDE5DC' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FDF8F4'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color || '#C17B6B', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#2C1810', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.source === 'leave' ? (ev.displayTitle || ev.title) : ev.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
