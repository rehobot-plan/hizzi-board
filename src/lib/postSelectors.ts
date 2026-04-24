/**
 * Post 타임스탬프 기반 회수 창 selector.
 *
 * main-ux.md §2.3 3층 복구 구조의 데이터 레이어.
 * windowMs는 호출부에서 덮어쓸 수 있게 범용 파라미터로 둠 —
 * 블록 ③에서 "24h 초과 ~ 30일" 구간도 동일 함수 재사용 예정.
 *
 * 순수 함수. firebase/zustand/react 의존성 없음 → 단위 테스트 가능.
 */

import type { Post } from '@/store/postStore';

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

export interface RecentWindowOptions {
  /** 창 크기 (밀리초). 기본 24시간. */
  windowMs?: number;
  /** 기준 시각. 기본 Date.now(). 테스트 주입용. */
  now?: number;
}

function toMs(value: Date | null | undefined): number | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

/**
 * completedAt 이 (now - windowMs) 이후인 완료된 post만 반환.
 * - completedAt 없음 / completed false / pending createdAt null 등은 제외.
 * - 정렬은 호출부 책임 (selector는 필터만).
 */
export function selectRecentlyCompleted(
  posts: Post[],
  options: RecentWindowOptions = {},
): Post[] {
  const windowMs = options.windowMs ?? DAY_MS;
  const now = options.now ?? Date.now();
  const threshold = now - windowMs;
  return posts.filter(p => {
    if (!p.completed) return false;
    const t = toMs(p.completedAt);
    if (t === null) return false;
    return t >= threshold;
  });
}

/**
 * deletedAt 이 (now - windowMs) 이후인 삭제된 post만 반환.
 * - deletedAt 없음 / deleted false 등은 제외.
 * - 정렬은 호출부 책임.
 */
export function selectRecentlyDeleted(
  posts: Post[],
  options: RecentWindowOptions = {},
): Post[] {
  const windowMs = options.windowMs ?? DAY_MS;
  const now = options.now ?? Date.now();
  const threshold = now - windowMs;
  return posts.filter(p => {
    if (!p.deleted) return false;
    const t = toMs(p.deletedAt);
    if (t === null) return false;
    return t >= threshold;
  });
}

/**
 * post 공개범위 권한 판정 — Panel·RecordModal 공유.
 * visibleTo 해석:
 *  - 빈 배열(또는 null/undefined) → public
 *  - [author] → private (본인만)
 *  - [author, ...others] → specific (본인 + 지정 대상)
 * admin / post.author / visibleTo 포함 email만 true.
 */
export interface ViewerContext {
  email: string | null | undefined;
  role?: string | null;
}

export function canViewPost(post: Post, viewer: ViewerContext | null | undefined): boolean {
  const visibleTo = post.visibleTo;
  if (!visibleTo || visibleTo.length === 0) return true;
  if (!viewer) return false;
  if (viewer.role === 'admin') return true;
  const email = viewer.email ?? '';
  if (post.author === email) return true;
  if (visibleTo.includes(email)) return true;
  return false;
}
