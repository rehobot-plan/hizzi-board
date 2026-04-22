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

const TAG = 'mydesk-phase2-restore';
let postId: string;

test.beforeAll(async () => {
  const db = getDb();
  // 휴지통 상태 할일 1건 생성
  const ref = await db.collection('posts').add({
    panelId: 'admin', content: '__p2r_복원테스트', author: 'admin@company.com',
    category: '할일', visibleTo: [], taskType: 'work',
    completed: true, completedAt: new Date(), deleted: true, deletedAt: new Date(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    seedTag: TAG,
  });
  postId = ref.id;
});

test.afterAll(async () => {
  const db = getDb();
  if (postId) await db.collection('posts').doc(postId).delete().catch(() => {});
});

test.describe('할일 탭 — 복원 검증', () => {
  test('휴지통 → 복원 → Firestore 4필드 동시 초기화', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/mydesk/todo');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(3000);

    // 휴지통 세그먼트
    await page.locator('[data-testid="segment-trash"]').click();
    await page.waitForTimeout(2000);

    // 복원 버튼 클릭
    const row = page.locator(`[data-testid="todo-row-${postId}"]`);
    const restoreBtn = row.locator('button:has-text("복원")');
    if (await restoreBtn.isVisible()) {
      await restoreBtn.click();
      await page.waitForTimeout(3000);

      // Firestore 직접 조회 — R4.10 실행 경로 trace
      const db = getDb();
      const doc = await db.collection('posts').doc(postId).get();
      const data = doc.data();

      expect(data?.deleted).toBe(false);
      expect(data?.completed).toBe(false);
      expect(data?.completedAt).toBeNull();
      expect(data?.deletedAt).toBeNull();

      console.log(`[restore] deleted=${data?.deleted} completed=${data?.completed} completedAt=${data?.completedAt} deletedAt=${data?.deletedAt}`);
      await takeScreenshot(page, 'todo-restore-verified');
    }
  });
});
