import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';
import { takeScreenshot } from '../utils/screenshot';
import * as admin from 'firebase-admin';
import * as path from 'path';

const SERVICE_ACCOUNT_PATH = path.resolve('D:/Dropbox/Dropbox/serviceAccount.json');
const TEST_PREFIX = '__test_cancel_';

let app: admin.app.App;
function getDb() {
  if (!app) {
    const sa = require(SERVICE_ACCOUNT_PATH);
    app = admin.apps.length ? admin.app() : admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  return app.firestore();
}

let reqId: string;
const commentIds: string[] = [];

test.beforeAll(async () => {
  const db = getDb();
  const ref = await db.collection('todoRequests').add({
    title: `${TEST_PREFIX}촬영 소품 리스트`,
    content: '다음 촬영에 필요한 소품 목록 정리 부탁드립니다.',
    fromEmail: 'admin@company.com', fromPanelId: 'admin',
    toEmail: 'oilpig85@gmail.com', toPanelId: 'panel-3',
    status: 'accepted', visibleTo: [],
    createdAt: admin.firestore.Timestamp.now(),
    resolvedAt: admin.firestore.Timestamp.now(),
  });
  reqId = ref.id;
});

test.afterAll(async () => {
  const db = getDb();
  for (const id of commentIds) {
    await db.collection('comments').doc(id).delete().catch(() => {});
  }
  if (reqId) await db.collection('todoRequests').doc(reqId).delete().catch(() => {});
});

test.describe('요청자 취소 요청 플로우', () => {
  test('accepted → 취소 요청 → 대기 배너 → 철회', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/request');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });

    // 보낸 요청 탭
    await page.locator('text=보낸 요청').click();
    await page.waitForTimeout(2000);

    // 시드 아이템 클릭
    const item = page.locator(`text=${TEST_PREFIX}촬영 소품 리스트`).first();
    await item.click();
    const popup = page.locator('[role="dialog"]');
    await expect(popup).toBeVisible({ timeout: 5000 });

    // 취소 요청 버튼 확인
    const cancelBtn = popup.locator('[data-testid="request-cancel-btn"]');
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // 확인 다이얼로그
    await expect(popup.locator('text=담당자가 승인해야 취소됩니다')).toBeVisible();
    await popup.locator('[data-testid="confirm-cancel"]').click();
    await page.waitForTimeout(2000);

    // 상태 변경 확인: cancel_requested → 취소 대기 뱃지
    await expect(popup.locator('text=취소 대기')).toBeVisible({ timeout: 5000 });

    // 앰버 배너 확인
    const banner = popup.locator('[data-testid="cancel-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('승인을 기다리고 있습니다');
    await takeScreenshot(page, 'request-cancel-waiting');

    // 철회 버튼 클릭
    const withdrawBtn = popup.locator('[data-testid="withdraw-cancel-btn"]');
    await expect(withdrawBtn).toBeVisible();
    await withdrawBtn.click();
    await page.waitForTimeout(2000);

    // accepted 복귀 확인
    await expect(popup.locator('text=수락됨')).toBeVisible({ timeout: 5000 });
    await expect(banner).not.toBeVisible();
    await takeScreenshot(page, 'request-cancel-withdrawn');

    // 생성된 system comments 정리용 ID 수집
    const db = getDb();
    const snap = await db.collection('comments').where('requestId', '==', reqId).get();
    snap.docs.forEach(d => commentIds.push(d.id));
  });
});
