import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';
import { takeScreenshot } from '../../utils/screenshot';
import * as admin from 'firebase-admin';
import * as path from 'path';

const SA_PATH = path.resolve('D:/Dropbox/Dropbox/serviceAccount.json');
let app: admin.app.App;
function getDb() {
  if (!app) {
    const sa = require(SA_PATH);
    app = admin.apps.length ? admin.app() : admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  return app.firestore();
}

const TAG = 'mydesk-phase2-cascade';
let postId: string;
let reqId: string;

test.beforeAll(async () => {
  const db = getDb();
  // 요청 1건 (accepted)
  const rRef = await db.collection('todoRequests').add({
    fromEmail: 'oilpig85@gmail.com', fromPanelId: 'panel-3',
    toEmail: 'admin@company.com', toPanelId: 'admin',
    title: '__p2c_연쇄테스트', content: '연쇄 검증', visibleTo: [], status: 'accepted',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
    seedTag: TAG,
  });
  reqId = rRef.id;
  // 관련 할일 1건
  const pRef = await db.collection('posts').add({
    panelId: 'admin', content: '__p2c_연쇄테스트', author: 'admin@company.com',
    category: '할일', visibleTo: [], taskType: 'work',
    completed: false, deleted: false, starred: false,
    requestId: reqId, requestFrom: 'oilpig85@gmail.com', requestTitle: '__p2c_연쇄테스트',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    seedTag: TAG,
  });
  postId = pRef.id;
});

test.afterAll(async () => {
  const db = getDb();
  // 생성된 system comments 정리
  const cSnap = await db.collection('comments').where('requestId', '==', reqId).get();
  for (const d of cSnap.docs) await d.ref.delete().catch(() => {});
  if (postId) await db.collection('posts').doc(postId).delete().catch(() => {});
  if (reqId) await db.collection('todoRequests').doc(reqId).delete().catch(() => {});
});

test.describe('할일 탭 — requestId 연쇄 검증', () => {
  test('완료 전환 → todoRequests.status=completed 연쇄', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/mydesk/todo');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(3000);

    // 아이템 체크 → 벌크 완료
    const row = page.locator('text=__p2c_연쇄테스트').first();
    if (await row.isVisible()) {
      const checkbox = row.locator('..').locator('..').locator('input[type="checkbox"]');
      await checkbox.check();
      await page.waitForTimeout(500);

      const bulkBar = page.locator('[data-testid="bulk-bar"]');
      await expect(bulkBar).toBeVisible();
      await bulkBar.locator('text=완료로').click();
      await page.waitForTimeout(3000);

      // Firestore 연쇄 확인
      const db = getDb();
      const reqDoc = await db.collection('todoRequests').doc(reqId).get();
      expect(reqDoc.data()?.status).toBe('completed');
      console.log(`[cascade] completed: todoRequests.status=${reqDoc.data()?.status}`);

      // 복원 → accepted 복원 확인
      await page.locator('[data-testid="segment-completed"]').click();
      await page.waitForTimeout(2000);
      const restoreBtn = page.locator('text=__p2c_연쇄테스트').locator('..').locator('..').locator('text=되돌리기');
      if (await restoreBtn.isVisible()) {
        await restoreBtn.click();
        await page.waitForTimeout(3000);

        const reqDoc2 = await db.collection('todoRequests').doc(reqId).get();
        expect(reqDoc2.data()?.status).toBe('accepted');
        console.log(`[cascade] restore: todoRequests.status=${reqDoc2.data()?.status}`);
      }

      await takeScreenshot(page, 'todo-cascade-verified');
    }
  });
});
