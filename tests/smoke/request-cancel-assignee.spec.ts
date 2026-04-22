import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';
import { takeScreenshot } from '../utils/screenshot';
import * as admin from 'firebase-admin';
import * as path from 'path';

const SERVICE_ACCOUNT_PATH = path.resolve('D:/Dropbox/Dropbox/serviceAccount.json');
const TEST_PREFIX = '__test_assignee_cancel_';

let app: admin.app.App;
function getDb() {
  if (!app) {
    const sa = require(SERVICE_ACCOUNT_PATH);
    app = admin.apps.length ? admin.app() : admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  return app.firestore();
}

let reqIdDeny: string;
let reqIdApprove: string;
const commentIds: string[] = [];

test.beforeAll(async () => {
  const db = getDb();
  // 거부 테스트용
  const ref1 = await db.collection('todoRequests').add({
    title: `${TEST_PREFIX}거부 테스트`,
    content: '취소 거부 테스트용 요청입니다.',
    fromEmail: 'oilpig85@gmail.com', fromPanelId: 'panel-3',
    toEmail: 'admin@company.com', toPanelId: 'admin',
    status: 'cancel_requested',
    cancelRequestedAt: admin.firestore.Timestamp.now(),
    cancelRequestedBy: 'oilpig85@gmail.com',
    visibleTo: [],
    createdAt: admin.firestore.Timestamp.now(),
    resolvedAt: admin.firestore.Timestamp.now(),
  });
  reqIdDeny = ref1.id;

  // 승인 테스트용
  const ref2 = await db.collection('todoRequests').add({
    title: `${TEST_PREFIX}승인 테스트`,
    content: '취소 승인 테스트용 요청입니다.',
    fromEmail: 'oilpig85@gmail.com', fromPanelId: 'panel-3',
    toEmail: 'admin@company.com', toPanelId: 'admin',
    status: 'cancel_requested',
    cancelRequestedAt: admin.firestore.Timestamp.now(),
    cancelRequestedBy: 'oilpig85@gmail.com',
    visibleTo: [],
    createdAt: admin.firestore.Timestamp.now(),
    resolvedAt: admin.firestore.Timestamp.now(),
  });
  reqIdApprove = ref2.id;
});

test.afterAll(async () => {
  const db = getDb();
  for (const id of commentIds) {
    await db.collection('comments').doc(id).delete().catch(() => {});
  }
  for (const id of [reqIdDeny, reqIdApprove]) {
    if (id) await db.collection('todoRequests').doc(id).delete().catch(() => {});
  }
});

test.describe('담당자 취소 승인/거부', () => {
  test('cancel_requested — 배너 + 취소 거부 → accepted 복귀', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/request');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(2000);

    // 받은 요청 탭 (기본)
    const item = page.locator(`text=${TEST_PREFIX}거부 테스트`).first();
    await item.click();
    const popup = page.locator('[role="dialog"]');
    await expect(popup).toBeVisible({ timeout: 5000 });

    // 핑크색 배너 확인
    const banner = popup.locator('[data-testid="assignee-cancel-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('취소를 요청했습니다');
    await takeScreenshot(page, 'assignee-cancel-banner');

    // 거부 버튼 + 승인 버튼 확인
    await expect(popup.locator('[data-testid="deny-cancel-btn"]')).toBeVisible();
    await expect(popup.locator('[data-testid="approve-cancel-btn"]')).toBeVisible();

    // 취소 거부
    await popup.locator('[data-testid="deny-cancel-btn"]').click();
    await page.waitForTimeout(2000);

    // accepted 복귀
    await expect(popup.locator('text=수락됨')).toBeVisible({ timeout: 5000 });
    await expect(banner).not.toBeVisible();
    await takeScreenshot(page, 'assignee-cancel-denied');
    await page.keyboard.press('Escape');

    // 정리용 comment IDs 수집
    const db = getDb();
    const snap1 = await db.collection('comments').where('requestId', '==', reqIdDeny).get();
    snap1.docs.forEach(d => commentIds.push(d.id));
  });

  test('cancel_requested — 취소 승인 → cancelled 확인', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/request');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(2000);

    const item = page.locator(`text=${TEST_PREFIX}승인 테스트`).first();
    await item.click();
    const popup = page.locator('[role="dialog"]');
    await expect(popup).toBeVisible({ timeout: 5000 });

    // 취소 승인
    await popup.locator('[data-testid="approve-cancel-btn"]').click();
    await page.waitForTimeout(2000);

    // cancelled 확인
    await expect(popup.locator('text=취소됨')).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, 'assignee-cancel-approved');

    // 정리용 comment IDs 수집
    const db = getDb();
    const snap2 = await db.collection('comments').where('requestId', '==', reqIdApprove).get();
    snap2.docs.forEach(d => commentIds.push(d.id));
  });
});
