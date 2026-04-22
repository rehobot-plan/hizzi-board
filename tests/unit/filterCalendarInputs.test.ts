import { describe, test, expect } from 'vitest';
import {
  filterCalendarInputs,
  type CalendarEventInput,
  type CalendarFilterUser,
  type CalendarCategory,
} from '@/lib/calendar-helpers';

const USERS: CalendarFilterUser[] = [
  { id: 'uid-alice', email: 'alice@x.com', name: '유미정' },
  { id: 'uid-bob', email: 'bob@x.com', name: '조향래' },
  { id: 'uid-admin', email: 'admin@company.com', name: '관리자' },
];

const ALL_EMAILS = USERS.map(u => u.email);
const ALL_CATEGORIES: CalendarCategory[] = ['work', 'request', 'personal'];

function calEv(overrides: {
  id?: string;
  authorId?: string;
  authorName?: string;
  color?: string;
  requestId?: string;
  requestFrom?: string;
  taskType?: string;
}): CalendarEventInput {
  return {
    id: overrides.id || 'ev1',
    title: 'test',
    start: '2026-04-21',
    end: '2026-04-22',
    backgroundColor: overrides.color || '#3B6D11',
    extendedProps: {
      source: 'calendar',
      rawCalendar: {
        id: overrides.id || 'ev1',
        title: 'test',
        startDate: '2026-04-21',
        endDate: '2026-04-21',
        color: overrides.color || '#3B6D11',
        authorId: overrides.authorId,
        authorName: overrides.authorName,
        requestId: overrides.requestId,
        requestFrom: overrides.requestFrom,
        taskType: overrides.taskType,
      },
      requestId: overrides.requestId,
      requestFrom: overrides.requestFrom,
    },
  };
}

function leaveEv(userEmail: string): CalendarEventInput {
  return {
    id: 'leave1',
    title: '연차',
    start: '2026-04-21',
    end: '2026-04-22',
    backgroundColor: '#534AB7',
    extendedProps: {
      source: 'leave',
      isLeave: true,
      rawLeave: {
        id: 'leave1',
        userId: 'uid-alice',
        userName: '유미정',
        userEmail,
        date: '2026-04-21',
        type: 'full',
        days: 1,
        confirmed: false,
        createdBy: userEmail,
      },
    },
  };
}

describe('filterCalendarInputs — §2.2 매칭 규칙', () => {
  test('1. taskType 없는 업무 색상 이벤트 → 업무 카테고리에만 포함', () => {
    const ev = calEv({ authorId: 'uid-alice', color: '#3B6D11' });
    expect(
      filterCalendarInputs([ev], { members: ALL_EMAILS, categories: ['work'], users: USERS }),
    ).toHaveLength(1);
    expect(
      filterCalendarInputs([ev], { members: ALL_EMAILS, categories: ['personal'], users: USERS }),
    ).toHaveLength(0);
  });

  test('2. taskType 없는 개인 색상 이벤트 → 개인 카테고리에만 포함', () => {
    const ev = calEv({ authorId: 'uid-alice', color: '#639922' });
    expect(
      filterCalendarInputs([ev], { members: ALL_EMAILS, categories: ['personal'], users: USERS }),
    ).toHaveLength(1);
    expect(
      filterCalendarInputs([ev], { members: ALL_EMAILS, categories: ['work'], users: USERS }),
    ).toHaveLength(0);
  });

  test('3. requestId + taskType=work 이벤트 → 요청 체크 시만 포함, 업무만 체크 시 제외 (배타)', () => {
    const ev = calEv({
      authorId: 'alice@x.com',
      color: '#993556',
      requestId: 'req-1',
      requestFrom: 'bob@x.com',
      taskType: 'work',
    });
    expect(
      filterCalendarInputs([ev], { members: ALL_EMAILS, categories: ['request'], users: USERS }),
    ).toHaveLength(1);
    expect(
      filterCalendarInputs([ev], { members: ALL_EMAILS, categories: ['work'], users: USERS }),
    ).toHaveLength(0);
    expect(
      filterCalendarInputs([ev], { members: ALL_EMAILS, categories: ['work', 'personal'], users: USERS }),
    ).toHaveLength(0);
  });

  test('4. leaveEvents → 개인 체크 시 포함, 해제 시 제외', () => {
    const ev = leaveEv('alice@x.com');
    expect(
      filterCalendarInputs([ev], { members: ALL_EMAILS, categories: ['personal'], users: USERS }),
    ).toHaveLength(1);
    expect(
      filterCalendarInputs([ev], { members: ALL_EMAILS, categories: ['work', 'request'], users: USERS }),
    ).toHaveLength(0);
  });

  test('5. 담당자 email 빈 배열 → 모든 이벤트 제외 (전체 해제 허용)', () => {
    const events = [
      calEv({ authorId: 'uid-alice', color: '#3B6D11' }),
      calEv({ id: 'ev2', authorId: 'uid-bob', color: '#639922' }),
      leaveEv('alice@x.com'),
    ];
    expect(
      filterCalendarInputs(events, { members: [], categories: ALL_CATEGORIES, users: USERS }),
    ).toHaveLength(0);
  });

  test('6. 저장된 담당자 email 일부가 users에 없어도 유효 email만 정상 매칭', () => {
    const events = [
      calEv({ authorId: 'uid-alice', color: '#3B6D11' }),
      calEv({ id: 'ev2', authorId: 'uid-bob', color: '#3B6D11' }),
    ];
    const result = filterCalendarInputs(events, {
      members: ['alice@x.com', 'ghost@x.com'],
      categories: ALL_CATEGORIES,
      users: USERS,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ev1');
  });

  test('요청 양방향 — fromEmail도 멤버 매칭 대상', () => {
    const ev = calEv({
      id: 'req-ev',
      authorId: 'admin@company.com',
      color: '#993556',
      requestId: 'req-2',
      requestFrom: 'alice@x.com',
    });
    expect(
      filterCalendarInputs([ev], {
        members: ['alice@x.com'],
        categories: ALL_CATEGORIES,
        users: USERS,
      }),
    ).toHaveLength(1);
  });

  test('authorName fallback — authorId가 id와 안 맞아도 이름 일치로 해결', () => {
    const ev = calEv({
      authorId: 'raw-firebase-uid-12345',
      authorName: '유미정',
      color: '#3B6D11',
    });
    expect(
      filterCalendarInputs([ev], {
        members: ['alice@x.com'],
        categories: ALL_CATEGORIES,
        users: USERS,
      }),
    ).toHaveLength(1);
  });
});
