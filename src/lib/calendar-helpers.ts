/**
 * calendar-helpers.ts
 * Calendar.tsx + calendar-poc/page.tsx에서 추출한 순수 함수/상수 모듈.
 * React·Firebase·FullCalendar에 의존하지 않는다.
 */

// ─── 상수 ────────────────────────────────────────────────────

export const HOLIDAYS_2026: Record<string, string> = {
  '2026-01-01':'신정','2026-01-28':'설날연휴','2026-01-29':'설날연휴','2026-01-30':'설날연휴',
  '2026-03-01':'삼일절','2026-05-05':'어린이날','2026-05-15':'부처님오신날','2026-06-06':'현충일',
  '2026-08-15':'광복절','2026-09-24':'추석연휴','2026-09-25':'추석연휴','2026-09-26':'추석연휴',
  '2026-10-03':'개천절','2026-10-09':'한글날','2026-12-25':'크리스마스',
};

export const DAY_NAMES: readonly string[] = ['일','월','화','수','목','금','토'] as const;
export const DAY_KEYS: readonly string[] = ['sun','mon','tue','wed','thu','fri','sat'] as const;
export const KOREAN_DAYS: readonly string[] = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'] as const;

// ─── 색상 헬퍼 ──────────────────────────────────────────────

export function getEventColor(taskType?: string, visibility?: string): string {
  if (taskType === 'work' || !taskType) {
    if (!visibility || visibility === 'all') return '#3B6D11';
    if (visibility === 'me') return '#185FA5';
    return '#854F0B';
  }
  // personal
  if (!visibility || visibility === 'all') return '#639922';
  if (visibility === 'me') return '#378ADD';
  return '#BA7517';
}

export function isPersonal(color: string): boolean {
  return color === '#639922' || color === '#378ADD' || color === '#BA7517';
}

export function isLeave(color: string): boolean {
  return color === '#534AB7';
}

export function isRequest(color: string): boolean {
  return color === '#993556';
}

// ─── 날짜 헬퍼 ──────────────────────────────────────────────

export function toDS(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

export function addYears(date: Date, n: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + n);
  return d;
}

export function getPrevDateStr(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return toDS(d);
}

export function getNextDateStr(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return toDS(d);
}

export function buildDateRange(startStr: string, endStr: string): string[] {
  const results: string[] = [];
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  const step = start <= end ? 1 : -1;
  let d = new Date(start);
  while (step > 0 ? d <= end : d >= end) {
    results.push(toDS(d));
    d = addDays(d, step);
  }
  return results;
}

// ─── 반복 일정 헬퍼 ─────────────────────────────────────────

export interface RepeatOptions {
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  weeklyDay: string;
  excludeHolidays: boolean;
  endType: 'forever' | 'date' | 'count';
  endDate: string;
  endCount: number;
}

export function buildRepeatDates(startStr: string, opts: RepeatOptions): string[] {
  const start = new Date(startStr + 'T00:00:00');
  const results: string[] = [];

  if (opts.repeatType === 'none') return [startStr];

  let limitDate: Date;
  if (opts.endType === 'date' && opts.endDate) {
    limitDate = new Date(opts.endDate + 'T00:00:00');
  } else {
    limitDate = new Date(start);
    limitDate.setFullYear(limitDate.getFullYear() + 1);
  }

  const maxItems = opts.endType === 'count' ? opts.endCount : 500;
  let d = new Date(start);

  while (d <= limitDate && results.length < maxItems) {
    const ds = toDS(d);
    let shouldAdd = false;

    if (opts.repeatType === 'daily') {
      shouldAdd = true;
      d = addDays(d, 1);
    } else if (opts.repeatType === 'weekly') {
      const dayKey = DAY_KEYS[d.getDay()];
      if (dayKey === opts.weeklyDay) shouldAdd = true;
      d = addDays(d, 1);
    } else if (opts.repeatType === 'monthly') {
      shouldAdd = true;
      d = addMonths(d, 1);
    } else if (opts.repeatType === 'yearly') {
      shouldAdd = true;
      d = addYears(d, 1);
    }

    if (shouldAdd) {
      if (opts.excludeHolidays && HOLIDAYS_2026[ds]) continue;
      results.push(ds);
    }

    if (results.length >= 500) break;
  }

  return results;
}

// ─── 연차 연속 블록 병합 ────────────────────────────────────

export interface LeaveLikeEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color?: string;
  extendedProps?: {
    isLeave?: boolean;
    leaveUserId?: string;
    originalIds?: string[];
    [key: string]: unknown;
  };
}

export function mergeConsecutiveLeave<T extends LeaveLikeEvent>(events: T[]): (T | LeaveLikeEvent)[] {
  const leaves: T[] = [];
  const others: T[] = [];

  for (const ev of events) {
    if (ev.extendedProps?.isLeave && ev.extendedProps?.leaveUserId) {
      leaves.push(ev);
    } else {
      others.push(ev);
    }
  }

  if (leaves.length === 0) return events;

  const byUser = new Map<string, T[]>();
  for (const lv of leaves) {
    const uid = lv.extendedProps!.leaveUserId as string;
    if (!byUser.has(uid)) byUser.set(uid, []);
    byUser.get(uid)!.push(lv);
  }

  const merged: (T | LeaveLikeEvent)[] = [];

  for (const [, userLeaves] of byUser) {
    userLeaves.sort((a, b) => a.start.localeCompare(b.start));

    const dateCounts = new Map<string, number>();
    for (const lv of userLeaves) {
      dateCounts.set(lv.start, (dateCounts.get(lv.start) || 0) + 1);
    }

    let chain: T[] = [];

    const flush = () => {
      if (chain.length === 0) return;
      if (chain.length === 1) {
        merged.push(chain[0]);
      } else {
        const first = chain[0];
        const last = chain[chain.length - 1];
        merged.push({
          id: `leave-block-${first.extendedProps!.leaveUserId}-${first.start}`,
          title: first.title,
          start: first.start,
          end: last.end,
          color: first.color,
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
      const d = lv.start;

      if ((dateCounts.get(d) || 0) > 1) {
        flush();
        merged.push(lv);
        continue;
      }

      if (chain.length === 0) {
        chain.push(lv);
      } else {
        const prevEnd = chain[chain.length - 1].end;
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

  return [...others, ...merged];
}

// ─── Firestore → FullCalendar 어댑터 ───────────────────────

/** Firestore calendarEvents 문서 최소 인터페이스 */
export interface CalendarEventDoc {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  authorId?: string;
  authorName?: string;
  createdAt?: { toMillis?: () => number; seconds?: number };
  repeatGroupId?: string;
  requestId?: string;
  requestFrom?: string;
  requestTitle?: string;
}

/** Firestore leaveEvents 문서 최소 인터페이스 */
export interface LeaveEventDoc {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  date: string;
  type: 'full' | 'half_am' | 'half_pm';
  days: number;
  memo?: string;
  confirmed: boolean;
  createdBy: string;
}

/** FullCalendar EventInput 호환 출력 */
export interface CalendarEventInput {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  extendedProps: {
    source: 'calendar' | 'leave';
    rawCalendar?: CalendarEventDoc;
    rawLeave?: LeaveEventDoc;
    requestId?: string;
    requestFrom?: string;
    requestTitle?: string;
    isLeave?: boolean;
    leaveUserId?: string;
    originalIds?: string[];
    [key: string]: unknown;
  };
}

function addOneDayExclusive(dateStr: string): string {
  return toDS(addDays(new Date(dateStr + 'T00:00:00'), 1));
}

/**
 * Firestore calendarEvents + leaveEvents → FullCalendar EventInput[] 변환.
 * - calendarEvents: startDate/endDate → start/end(+1일 exclusive)
 * - leaveEvents: 동일 userId 연속 블록 병합 후 start/end(+1일) 변환
 */
export function buildCalendarEventInputs(
  calendarEvents: CalendarEventDoc[],
  leaveEvents: LeaveEventDoc[],
): CalendarEventInput[] {
  // 1) calendarEvents → EventInput
  const calInputs: CalendarEventInput[] = calendarEvents.map(ev => ({
    id: ev.id,
    title: ev.title || '(제목 없음)',
    start: ev.startDate,
    end: addOneDayExclusive(ev.endDate),
    backgroundColor: ev.color || '#3B6D11',
    extendedProps: {
      source: 'calendar' as const,
      rawCalendar: ev,
      requestId: ev.requestId,
      requestFrom: ev.requestFrom,
      requestTitle: ev.requestTitle,
    },
  }));

  // 2) leaveEvents → LeaveLikeEvent 변환 → 연속 블록 병합
  const leaveLike: LeaveLikeEvent[] = leaveEvents.map(ev => {
    const typeLabel = ev.type === 'full' ? '연차' : ev.type === 'half_am' ? '오전반차' : '오후반차';
    return {
      id: ev.id,
      title: `${ev.userName || '직원'} ${typeLabel}${ev.confirmed ? ' 🔒' : ''}`,
      start: ev.date,
      end: addOneDayExclusive(ev.date),
      color: '#534AB7',
      extendedProps: {
        isLeave: true,
        leaveUserId: ev.userId,
        rawLeave: ev,
      },
    };
  });

  const mergedLeave = mergeConsecutiveLeave(leaveLike);

  const leaveInputs: CalendarEventInput[] = mergedLeave.map(ev => ({
    id: ev.id,
    title: ev.title,
    start: ev.start,
    end: ev.end,
    backgroundColor: ev.color || '#534AB7',
    extendedProps: {
      source: 'leave' as const,
      isLeave: true,
      leaveUserId: ev.extendedProps?.leaveUserId as string | undefined,
      rawLeave: ev.extendedProps?.rawLeave as LeaveEventDoc | undefined,
      originalIds: ev.extendedProps?.originalIds as string[] | undefined,
    },
  }));

  return [...calInputs, ...leaveInputs];
}
