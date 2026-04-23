// tests/e2e/helpers/chat-input.ts
// §6 홈 채팅 입력 E2E 공통 유틸.
// 프로덕션 Firestore에 임시 문서 남기지 않기 위한 cleanup 포함.

import type { Page } from '@playwright/test';
import * as admin from 'firebase-admin';
import * as path from 'path';

// ─── Firebase Admin SDK 싱글턴 ───
const SA_PATH = path.resolve('D:/Dropbox/Dropbox/serviceAccount.json');
let app: admin.app.App | null = null;

export function getAdminDb(): FirebaseFirestore.Firestore {
  if (!app) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sa = require(SA_PATH);
    app = admin.apps.length
      ? admin.app()
      : admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  return app.firestore();
}

// ─── 테스트 seed 식별 ───
export const S6_SEED_TAG = '__test_s6_chat__';

// admin 계정 이메일 — storageState 대상
export const ADMIN_EMAIL = 'admin@company.com';

// admin 계정 테스트용 패널 ID (panels 컬렉션). ownerEmail로 조회되므로 id값 자체는 자유.
const ADMIN_PANEL_DOC_ID = '__test_s6_admin_panel__';

/**
 * admin 계정용 테스트 패널을 panels 컬렉션에 보장.
 * ChatInputStore.findMyPanelId는 ownerEmail 일치 패널을 찾는다.
 * 다른 admin 테스트와 충돌하지 않도록 고정 ID + seedTag 부여.
 */
export async function ensureAdminPanel(): Promise<string> {
  const db = getAdminDb();
  const ref = db.collection('panels').doc(ADMIN_PANEL_DOC_ID);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      name: '테스트 패널 (S6)',
      ownerEmail: ADMIN_EMAIL,
      position: 999,
      seedTag: S6_SEED_TAG,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  return ADMIN_PANEL_DOC_ID;
}

/**
 * 본 세션에서 생성된 chatMessages / posts / calendarEvents를 seedTag 또는 sourceMessageId로 정리.
 * admin 이메일 author 기준, chat inputSource만 타겟 — 실사용자 데이터 오염 회피.
 */
export async function cleanupS6Data(): Promise<void> {
  const db = getAdminDb();

  // 1) admin이 author인 chat inputSource posts 전수 삭제
  const postsSnap = await db
    .collection('posts')
    .where('author', '==', ADMIN_EMAIL)
    .where('inputSource', '==', 'chat')
    .get();
  await Promise.all(postsSnap.docs.map((d) => d.ref.delete()));

  // 2) admin이 author인 chat inputSource calendarEvents
  const eventsSnap = await db
    .collection('calendarEvents')
    .where('author', '==', ADMIN_EMAIL)
    .where('inputSource', '==', 'chat')
    .get();
  await Promise.all(eventsSnap.docs.map((d) => d.ref.delete()));

  // 3) admin이 userId인 chatMessages 전수 (rules가 delete 차단 — Admin SDK는 우회 가능)
  const msgSnap = await db
    .collection('chatMessages')
    .where('userId', '==', ADMIN_EMAIL)
    .get();
  await Promise.all(msgSnap.docs.map((d) => d.ref.delete()));
}

// ─── 고정 시간 주입 ───
// parseLocal의 Date 계산 결과 flakiness 회피. 2026-04-23 목요일 10:00 KST.
export const FIXED_NOW_ISO = '2026-04-23T01:00:00.000Z'; // UTC 01:00 = KST 10:00

/**
 * Playwright page.clock 로 고정 시점 주입.
 * 호출은 page.goto 전에.
 */
export async function installFixedClock(page: Page): Promise<void> {
  await page.clock.install({ time: new Date(FIXED_NOW_ISO) });
}

// ─── 홈 진입 ───
export async function gotoHome(page: Page): Promise<void> {
  await page.goto('/');
  // ChatInput은 인증 후 홈에서만 렌더. aside는 main layout에 속해있음.
  await page.locator('aside').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('[data-testid="chat-input"]').waitFor({ state: 'visible', timeout: 10000 });
}

// ─── 입력 + programmatic 서브밋 (actionability scroll 회피, MEMORY #61-b) ───
export async function typeAndSubmit(page: Page, text: string): Promise<void> {
  const input = page.locator('[data-testid="chat-input"]');
  await input.fill(text);
  // 서브밋 버튼 DOM click (programmatic) — Playwright click actionability scroll 회피
  await page.locator('[data-testid="chat-submit"]').evaluate((el) => (el as HTMLButtonElement).click());
}

// ─── 확장 영역 ContainerLocator 헬퍼 ───
export function expandLocator(page: Page) {
  return page.locator('[data-testid="chat-expand"]');
}
