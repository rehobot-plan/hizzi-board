import { describe, test, expect } from 'vitest';
import { calendarEvent } from '@/styles/tokens';

describe('calendarEvent 토큰 — 블록 2 단일 출처 통합 (calendar-visual.md §3)', () => {
  test('render 공통값 — 블록 3 튜닝 값 (font 11 · padding 2px 4px · border 3px · lineHeight 1.3)', () => {
    expect(calendarEvent.render.fontSize).toBe(11);
    expect(calendarEvent.render.padding).toBe('2px 4px');
    expect(calendarEvent.render.borderRadius).toBe(3);
    expect(calendarEvent.render.lineHeight).toBe(1.3);
    expect(calendarEvent.render.textOnSolid).toBe('#fff');
    expect(calendarEvent.render.personalBorderWidth).toBe(3);
    expect(calendarEvent.render.leaveBorderWidth).toBe(3);
    expect(calendarEvent.render.requestBorderWidth).toBe(3);
  });

  test('반투명 계열 alpha 0.25 — 개인 3종 + 연차만 (블록 3 §4.2)', () => {
    expect(calendarEvent.personal.all.bg).toBe('rgba(99,153,34,0.25)');
    expect(calendarEvent.personal.meOnly.bg).toBe('rgba(55,138,221,0.25)');
    expect(calendarEvent.personal.specific.bg).toBe('rgba(186,117,23,0.25)');
    expect(calendarEvent.leave.bg).toBe('rgba(83,74,183,0.25)');
  });

  test('personal 칩 rangeBg — 칩 선택 전용 alpha 0.1 (alpha 튜닝 영향 없음)', () => {
    expect(calendarEvent.personal.rangeBg).toBe('rgba(55,138,221,0.1)');
    expect(calendarEvent.personal.rangeBg).not.toBe(calendarEvent.personal.meOnly.bg);
  });

  test('카테고리 대표 색 — uxui.md §4 범례 8종 매치 (회귀 방어)', () => {
    expect(calendarEvent.work.all).toBe('#3B6D11');
    expect(calendarEvent.work.meOnly).toBe('#185FA5');
    expect(calendarEvent.work.specific).toBe('#854F0B');
    expect(calendarEvent.personal.all.border).toBe('#639922');
    expect(calendarEvent.personal.meOnly.border).toBe('#378ADD');
    expect(calendarEvent.personal.specific.border).toBe('#BA7517');
    expect(calendarEvent.leave.border).toBe('#534AB7');
    expect(calendarEvent.request.bg).toBe('#993556');
  });
});
