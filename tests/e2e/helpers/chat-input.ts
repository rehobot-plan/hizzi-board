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

// admin 계정 테스트용 패널 ID (panels 컬렉션). Firestore reserved ID 패턴(__x__) 회피.
const ADMIN_PANEL_DOC_ID = 'test-s6-admin-panel';

/**
 * admin 계정용 테스트 패널을 panels 컬렉션에 보장.
 * ChatInputStore.findMyPanelId는 ownerEmail 일치 패널을 찾는다.
 * 다른 admin 테스트와 충돌하지 않도록 고정 ID + seedTag 부여.
 */
export async function ensureAdminPanel(): Promise<string> {
  const db = getAdminDb();
  const ref = db.collection('panels').doc(ADMIN_PANEL_DOC_ID);
  // 무조건 set (merge 없음) — 매 테스트 시작 시 ownerEmail·categories 전체 재설정.
  // 세션 내 어떤 경로로 ownerEmail: null 리셋되는 현상 방어.
  await ref.set({
    name: '테스트 패널 (S6)',
    ownerEmail: ADMIN_EMAIL,
    position: 999,
    seedTag: S6_SEED_TAG,
    categories: ['할일', '메모'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
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
 * Date.now만 고정 (timers는 자연 진행).
 * page.clock.install()은 timers까지 freeze해 React 업데이트 hang — setFixedTime 사용.
 * 호출은 page.goto 전에.
 */
export async function installFixedClock(page: Page): Promise<void> {
  await page.clock.setFixedTime(new Date(FIXED_NOW_ISO));
}

// ─── 모바일 안전 로그인 ───
// 기존 loginAsAdmin은 aside(데스크탑 sidebar) visible 대기 — 모바일(`hidden md:flex`)에선 timeout.
// URL 대기 + Header의 "Hizzi is happy" banner로 대체.
export async function loginAsAdminForAnyViewport(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('admin@company.com');
  await page.locator('input[type="password"]').fill('admin1234!');
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL('/', { timeout: 30000 });
  await page.getByText('Hizzi is happy, and you?').first().waitFor({ state: 'visible', timeout: 15000 });
}

// ─── 홈 진입 ───
// 전제: loginAsAdmin이 이미 실행돼 page는 '/'에 있고 authStore 안정화 됨.
// 중요: 추가 page.goto('/') 호출 금지 — page reload 시 onAuthStateChanged가 다시
// clearAdminPanelOwnership 호출해 admin 패널 ownerEmail를 null로 리셋함(authStore.ts L150~166).
export async function gotoHome(page: Page): Promise<void> {
  // clearAdminPanelOwnership 완료 대기 + Firestore 상태 안정화
  await page.waitForTimeout(2500);
  // admin 패널 ownerEmail = admin 재seed (onAuthStateChanged 호출 모두 끝난 후)
  await ensureAdminPanel();
  // panelStore onSnapshot이 admin 패널 업데이트 반영할 시간
  await page.waitForTimeout(1500);

  const viewportSize = page.viewportSize();
  const isDesktop = viewportSize && viewportSize.width >= 768;
  if (isDesktop) {
    await page.locator('aside').waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('[data-panel-id="test-s6-admin-panel"]').waitFor({ state: 'visible', timeout: 10000 });
  }
  await page.locator('[data-testid="chat-input"]').waitFor({ state: 'visible', timeout: 10000 });
}

// ─── 입력 + 서브밋 버튼 activated 대기 후 programmatic click ───
// fill 직후 button disabled 해제(zustand inputValue 반영)를 명시적으로 대기.
// programmatic click로 actionability scroll 회피(MEMORY #61-b).
export async function typeAndSubmit(page: Page, text: string): Promise<void> {
  const input = page.locator('[data-testid="chat-input"]');
  await input.fill(text);
  const submitBtn = page.locator('[data-testid="chat-submit"]');
  // zustand store 업데이트 후 disabled 풀림까지 대기
  await submitBtn.waitFor({ state: 'visible' });
  await submitBtn.evaluate((el) => {
    const btn = el as HTMLButtonElement;
    if (btn.disabled) throw new Error('submit button still disabled');
    btn.click();
  });
}

// ─── 확장 영역 ContainerLocator 헬퍼 ───
export function expandLocator(page: Page) {
  return page.locator('[data-testid="chat-expand"]');
}
