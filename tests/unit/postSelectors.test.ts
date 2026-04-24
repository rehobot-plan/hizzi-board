import { describe, test, expect } from 'vitest';
import {
  selectRecentlyCompleted,
  selectRecentlyDeleted,
  canViewPost,
  DAY_MS,
  HOUR_MS,
} from '@/lib/postSelectors';
import type { Post } from '@/store/postStore';

const NOW = new Date('2026-04-21T12:00:00+09:00').getTime();

function post(partial: Partial<Post>): Post {
  return {
    id: partial.id || 'p',
    panelId: 'panel-1',
    content: 'x',
    author: 'a@x.com',
    createdAt: new Date(NOW - 10 * DAY_MS),
    category: '할일',
    visibleTo: [],
    ...partial,
  } as Post;
}

describe('selectRecentlyCompleted — main-ux.md §2.3 24h 창 완료 회수', () => {
  test('1. 빈 배열 → 빈 배열 반환', () => {
    expect(selectRecentlyCompleted([], { now: NOW })).toEqual([]);
  });

  test('2. 창 경계 — 정확히 24h 전 포함, 24h + 1ms 전 제외', () => {
    const onEdge = post({ id: 'edge', completed: true, completedAt: new Date(NOW - DAY_MS) });
    const justOver = post({ id: 'over', completed: true, completedAt: new Date(NOW - DAY_MS - 1) });
    const result = selectRecentlyCompleted([onEdge, justOver], { now: NOW });
    expect(result.map(p => p.id)).toEqual(['edge']);
  });

  test('3. completedAt 없는 post 혼합 → 제외', () => {
    const withField = post({ id: 'a', completed: true, completedAt: new Date(NOW - HOUR_MS) });
    const withoutField = post({ id: 'b', completed: true });
    const nullField = post({ id: 'c', completed: true, completedAt: null });
    const result = selectRecentlyCompleted([withField, withoutField, nullField], { now: NOW });
    expect(result.map(p => p.id)).toEqual(['a']);
  });

  test('4. completed=false 는 completedAt 있어도 제외', () => {
    const active = post({ id: 'active', completed: false, completedAt: new Date(NOW - HOUR_MS) });
    expect(selectRecentlyCompleted([active], { now: NOW })).toEqual([]);
  });

  test('5. windowMs 덮어쓰기 — 1시간 창에선 12h 전 완료 제외', () => {
    const twelveH = post({ id: '12h', completed: true, completedAt: new Date(NOW - 12 * HOUR_MS) });
    const thirty = post({ id: '30m', completed: true, completedAt: new Date(NOW - 30 * 60 * 1000) });
    const result = selectRecentlyCompleted([twelveH, thirty], { now: NOW, windowMs: HOUR_MS });
    expect(result.map(p => p.id)).toEqual(['30m']);
  });

  test('6. 기본 windowMs 24h — options 생략 가능', () => {
    const recent = post({ id: 'r', completed: true, completedAt: new Date(Date.now() - HOUR_MS) });
    // options 완전 생략 (기본값 테스트)
    expect(selectRecentlyCompleted([recent]).length).toBe(1);
  });
});

describe('selectRecentlyDeleted — main-ux.md §2.3 24h 창 삭제 회수', () => {
  test('1. 빈 배열 → 빈 배열', () => {
    expect(selectRecentlyDeleted([], { now: NOW })).toEqual([]);
  });

  test('2. deleted=false 인데 deletedAt 있음 → 제외 (데이터 불일치 방어)', () => {
    const weird = post({ id: 'w', deleted: false, deletedAt: new Date(NOW - HOUR_MS) });
    expect(selectRecentlyDeleted([weird], { now: NOW })).toEqual([]);
  });

  test('3. deletedAt 없는 soft-deleted 혼합 → 제외 (legacy 방어)', () => {
    const legacy = post({ id: 'l', deleted: true });
    const normal = post({ id: 'n', deleted: true, deletedAt: new Date(NOW - 2 * HOUR_MS) });
    const result = selectRecentlyDeleted([legacy, normal], { now: NOW });
    expect(result.map(p => p.id)).toEqual(['n']);
  });

  test('4. windowMs 확장 — 30일 창에선 24h 초과 포함', () => {
    const tenDay = post({ id: '10d', deleted: true, deletedAt: new Date(NOW - 10 * DAY_MS) });
    const thirtyOne = post({ id: '31d', deleted: true, deletedAt: new Date(NOW - 31 * DAY_MS) });
    const result = selectRecentlyDeleted([tenDay, thirtyOne], { now: NOW, windowMs: 30 * DAY_MS });
    expect(result.map(p => p.id)).toEqual(['10d']);
  });
});

describe('canViewPost — main-ux.md §2 RecordModal·Panel 공유 공개범위 판정', () => {
  const author = 'author@x.com';
  const other = 'other@x.com';
  const outsider = 'outsider@x.com';

  test('1. public (visibleTo 빈 배열) — 비로그인 포함 전원 허용', () => {
    const p = post({ author, visibleTo: [] });
    expect(canViewPost(p, null)).toBe(true);
    expect(canViewPost(p, { email: outsider })).toBe(true);
  });

  test('2. public (visibleTo null/undefined) — 전원 허용', () => {
    const pNull = post({ author, visibleTo: null as unknown as string[] });
    const pUndef = post({ author, visibleTo: undefined as unknown as string[] });
    expect(canViewPost(pNull, { email: outsider })).toBe(true);
    expect(canViewPost(pUndef, { email: outsider })).toBe(true);
  });

  test('3. private ([author]) — author 만 허용, 타인 거부', () => {
    const p = post({ author, visibleTo: [author] });
    expect(canViewPost(p, { email: author })).toBe(true);
    expect(canViewPost(p, { email: outsider })).toBe(false);
  });

  test('4. specific ([author, other]) — 해당 이메일만 허용', () => {
    const p = post({ author, visibleTo: [author, other] });
    expect(canViewPost(p, { email: author })).toBe(true);
    expect(canViewPost(p, { email: other })).toBe(true);
    expect(canViewPost(p, { email: outsider })).toBe(false);
  });

  test('5. admin — visibleTo 제한 무시하고 전체 허용', () => {
    const p = post({ author, visibleTo: [author] });
    expect(canViewPost(p, { email: outsider, role: 'admin' })).toBe(true);
  });

  test('6. 비로그인 + 비-public — 거부', () => {
    const p = post({ author, visibleTo: [author] });
    expect(canViewPost(p, null)).toBe(false);
    expect(canViewPost(p, undefined)).toBe(false);
  });

  test('7. viewer email null — 비-public 거부', () => {
    const p = post({ author, visibleTo: [author] });
    expect(canViewPost(p, { email: null })).toBe(false);
    expect(canViewPost(p, { email: undefined })).toBe(false);
  });
});
