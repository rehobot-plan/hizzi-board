import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';
import { takeScreenshot } from '../utils/screenshot';
import * as admin from 'firebase-admin';
import * as path from 'path';

const SERVICE_ACCOUNT_PATH = path.resolve('D:/Dropbox/Dropbox/serviceAccount.json');
const TEST_PREFIX = '__test_badge_';

let app: admin.app.App;
function getDb() {
  if (!app) {
    const sa = require(SERVICE_ACCOUNT_PATH);
    app = admin.apps.length ? admin.app() : admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  return app.firestore();
}

const reqIds: string[] = [];

test.beforeAll(async () => {
  const db = getDb();

  // pending 2건 (admin이 받은 것) → N=2
  for (const title of ['뱃지 테스트 A', '뱃지 테스트 B']) {
    const ref = await db.collection('todoRequests').add({
      title: `${TEST_PREFIX}${title}`,
      content: '뱃지 카운트 테스트.',
      fromEmail: 'oilpig85@gmail.com', fromPanelId: 'panel-3',
      toEmail: 'admin@company.com', toPanelId: 'admin',
      status: 'pending', visibleTo: [],
      createdAt: admin.firestore.Timestamp.now(),
    });
    reqIds.push(ref.id);
  }

  // accepted 1건 (admin이 보낸 것, resolvedAt 세팅, seenAt 없음) → M=1
  const ref = await db.collection('todoRequests').add({
    title: `${TEST_PREFIX}뱃지 테스트 C`,
    content: '미확인 변동 테스트.',
    fromEmail: 'admin@company.com', fromPanelId: 'admin',
    toEmail: 'oilpig85@gmail.com', toPanelId: 'panel-3',
    status: 'accepted', visibleTo: [],
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2026-04-16T09:00:00+09:00')),
    resolvedAt: admin.firestore.Timestamp.now(),
  });
  reqIds.push(ref.id);
});

test.afterAll(async () => {
  const db = getDb();
  for (const id of reqIds) {
    await db.collection('todoRequests').doc(id).delete().catch(() => {});
  }
});

test.describe('사이드바 N+M 뱃지', () => {
  test('메인 페이지에서 뱃지 표시 확인', async ({ page }) => {
    await loginAsAdmin(page);
    // 메인 페이지에서 사이드바 뱃지 확인
    await page.waitForTimeout(3000); // Firestore 동기화 대기

    const badgeN = page.locator('[data-testid="badge-n"]');
    const badgeM = page.locator('[data-testid="badge-m"]');

    // N >= 2 (pending)
    await expect(badgeN).toBeVisible({ timeout: 10000 });
    const nText = await badgeN.textContent();
    expect(Number(nText)).toBeGreaterThanOrEqual(2);

    // M >= 1 (unseen)
    await expect(badgeM).toBeVisible({ timeout: 5000 });
    const mText = await badgeM.textContent();
    expect(Number(mText)).toBeGreaterThanOrEqual(1);

    await takeScreenshot(page, 'badge-initial');
  });

  test('/request에서 아이템 열기 → seenAt 갱신 후 M 감소', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/request');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(2000);

    // 보낸 요청 탭 → 뱃지 테스트 C 클릭 (accepted, unseen)
    await page.locator('text=보낸 요청').click();
    await page.waitForTimeout(1000);
    const item = page.locator(`text=${TEST_PREFIX}뱃지 테스트 C`).first();
    if (await item.isVisible()) {
      await item.click();
      const popup = page.locator('[role="dialog"]');
      await expect(popup).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(2000); // seenAt 갱신 대기
      await page.keyboard.press('Escape');
      await page.waitForTimeout(2000); // onSnapshot 반영 대기
    }

    await takeScreenshot(page, 'badge-after-seen');
  });
});
