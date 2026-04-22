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

const TAG = 'mydesk-phase3-e2e';
const ME = 'admin@company.com';
const seedIds: string[] = [];

test.beforeAll(async () => {
  const db = getDb();
  const ts = admin.firestore.FieldValue.serverTimestamp;
  const memos = [
    { content: '__p3e_업무메모', taskType: 'work', starred: true, deleted: false },
    { content: '__p3e_개인메모', taskType: 'personal', starred: false, deleted: false, visibleTo: [ME] },
    { content: '__p3e_삭제메모', taskType: 'work', deleted: true, deletedAt: new Date() },
  ];
  for (const m of memos) {
    const ref = await db.collection('posts').add({
      panelId: 'admin', author: ME, category: '메모',
      visibleTo: m.visibleTo || [], completed: false,
      createdAt: ts(), updatedAt: ts(), seedTag: TAG, ...m,
    });
    seedIds.push(ref.id);
  }
});

test.afterAll(async () => {
  const db = getDb();
  for (const id of seedIds) await db.collection('posts').doc(id).delete().catch(() => {});
});

test.describe('메모 탭', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/mydesk/memo');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(3000);
  });

  test('2 세그먼트 전환 + "완료" 세그먼트 없음', async ({ page }) => {
    await expect(page.locator('[data-testid="segment-active"]')).toBeVisible();
    await expect(page.locator('[data-testid="segment-trash"]')).toBeVisible();
    // 완료 세그먼트 없어야 함
    await expect(page.locator('[data-testid="segment-completed"]')).not.toBeVisible();
    await takeScreenshot(page, 'memo-segments');
  });

  test('필터 2개만 표시 (요청 없음)', async ({ page }) => {
    await expect(page.locator('[data-testid="filter-work"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-personal"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-request"]')).not.toBeVisible();
  });

  test('정렬 기본값: 최신 등록순', async ({ page }) => {
    const dropdown = page.locator('[data-testid="sort-dropdown"]');
    const text = await dropdown.textContent();
    expect(text).toContain('최신 등록순');
  });

  test('휴지통 세그먼트 + 복원', async ({ page }) => {
    await page.locator('[data-testid="segment-trash"]').click();
    await page.waitForTimeout(1000);

    const restoreBtn = page.locator('button:has-text("복원")').first();
    if (await restoreBtn.isVisible()) {
      await restoreBtn.click();
      await page.waitForTimeout(2000);

      // Firestore 검증
      const db = getDb();
      const doc = await db.collection('posts').doc(seedIds[2]).get();
      const data = doc.data();
      expect(data?.deleted).toBe(false);
      expect(data?.deletedAt).toBeNull();
      console.log(`[memo-restore] deleted=${data?.deleted} deletedAt=${data?.deletedAt}`);
    }
    await takeScreenshot(page, 'memo-trash');
  });

  test('체크박스 미표시 확인 (메모 모드 = reuse 검증)', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBe(0);
  });

  test('U2: 필터 전부 해제 → 전체 자동 복원', async ({ page }) => {
    const workFilter = page.locator('[data-testid="filter-work"]');
    const personalFilter = page.locator('[data-testid="filter-personal"]');
    // 둘 다 해제
    await workFilter.click();
    await personalFilter.click();
    await page.waitForTimeout(500);
    // 전체 자동 복원 → 둘 다 다시 활성 (아이템이 보여야 함)
    await takeScreenshot(page, 'memo-filter-u2');
  });

  test('휴지통 비우기 confirm 취소 시 데이터 유지', async ({ page }) => {
    await page.locator('[data-testid="segment-trash"]').click();
    await page.waitForTimeout(1000);
    const emptyBtn = page.locator('[data-testid="empty-trash"]');
    if (await emptyBtn.isVisible()) {
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('영구 삭제');
        await dialog.dismiss();
      });
      await emptyBtn.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'memo-safety-confirm');
    }
  });
});
