import { describe, test, expect } from 'vitest';
import {
  resolveDisplayCategory,
  type CalendarEventInput,
} from '@/lib/calendar-helpers';

function calEv(overrides: {
  source?: 'calendar' | 'leave';
  taskType?: string;
  color?: string;
  requestId?: string;
}): CalendarEventInput {
  const source = overrides.source || 'calendar';
  return {
    id: 'ev1',
    title: 'test',
    start: '2026-04-21',
    end: '2026-04-22',
    backgroundColor: overrides.color || '#3B6D11',
    extendedProps: {
      source,
      rawCalendar:
        source === 'calendar'
          ? {
              id: 'ev1',
              title: 'test',
              startDate: '2026-04-21',
              endDate: '2026-04-21',
              color: overrides.color || '#3B6D11',
              taskType: overrides.taskType,
              requestId: overrides.requestId,
            }
          : undefined,
      rawLeave:
        source === 'leave'
          ? {
              id: 'ev1',
              userId: 'u1',
              userName: 'tester',
              date: '2026-04-21',
              type: 'full',
              days: 1,
              confirmed: false,
              createdBy: 't@x.com',
            }
          : undefined,
      requestId: overrides.requestId,
    },
  };
}

describe('resolveDisplayCategory — calendar-visual.md §2.2 우선순위', () => {
  test('1. source=leave → leave (최우선, requestId 동시 보유해도 leave)', () => {
    const ev = calEv({ source: 'leave' });
    expect(resolveDisplayCategory(ev)).toBe('leave');
  });

  test('2. requestId + taskType=work → request (§6.2 배타)', () => {
    const ev = calEv({ requestId: 'r1', taskType: 'work', color: '#993556' });
    expect(resolveDisplayCategory(ev)).toBe('request');
  });

  test('3. requestId + taskType=personal → request (§6.2 우선순위)', () => {
    const ev = calEv({ requestId: 'r1', taskType: 'personal', color: '#993556' });
    expect(resolveDisplayCategory(ev)).toBe('request');
  });

  test('4. taskType=personal → personal', () => {
    const ev = calEv({ taskType: 'personal', color: '#639922' });
    expect(resolveDisplayCategory(ev)).toBe('personal');
  });

  test('5. taskType=work → work', () => {
    const ev = calEv({ taskType: 'work', color: '#3B6D11' });
    expect(resolveDisplayCategory(ev)).toBe('work');
  });

  test('6. taskType 부재 + personal color (#639922) → personal (color fallback)', () => {
    const ev = calEv({ color: '#639922' });
    expect(resolveDisplayCategory(ev)).toBe('personal');
  });

  test('7. taskType 부재 + personal meOnly color (#378ADD) → personal', () => {
    const ev = calEv({ color: '#378ADD' });
    expect(resolveDisplayCategory(ev)).toBe('personal');
  });

  test('8. taskType 부재 + work color (#3B6D11) → work', () => {
    const ev = calEv({ color: '#3B6D11' });
    expect(resolveDisplayCategory(ev)).toBe('work');
  });

  test('9. 세 필드 모두 부재 + legacy 6종 외 color → work (§6.1 폴백)', () => {
    const ev = calEv({ color: '#AABBCC' });
    expect(resolveDisplayCategory(ev)).toBe('work');
  });

  test('10. rawCalendar 자체 부재 → work (안전 폴백)', () => {
    const ev: CalendarEventInput = {
      id: 'bad',
      title: '',
      start: '',
      end: '',
      backgroundColor: '#000',
      extendedProps: { source: 'calendar' },
    };
    expect(resolveDisplayCategory(ev)).toBe('work');
  });

  test('11. 대소문자 오염 color — taskType=personal 의미 필드 있으면 영향 없음', () => {
    const ev = calEv({ taskType: 'personal', color: '#639922'.toUpperCase() });
    expect(resolveDisplayCategory(ev)).toBe('personal');
  });
});
