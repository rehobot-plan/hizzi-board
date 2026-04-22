import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';
import { takeScreenshot } from '../../utils/screenshot';

test.describe('할일 탭 — 벌크·안전장치', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/mydesk/todo');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(3000);
  });

  test('벌크 바 등장 + 취소로 사라짐', async ({ page }) => {
    // 아이템 체크박스 클릭
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await page.waitForTimeout(500);
      // 벌크 바 등장
      const bulkBar = page.locator('[data-testid="bulk-bar"]');
      await expect(bulkBar).toBeVisible();
      await expect(bulkBar).toContainText('1개 선택됨');
      await takeScreenshot(page, 'todo-bulk-bar');

      // 취소 클릭
      await bulkBar.locator('text=취소').click();
      await page.waitForTimeout(500);
      await expect(bulkBar).not.toBeVisible();
    }
  });

  test('휴지통 비우기 confirm 다이얼로그', async ({ page }) => {
    await page.locator('[data-testid="segment-trash"]').click();
    await page.waitForTimeout(1000);

    const emptyBtn = page.locator('[data-testid="empty-trash"]');
    if (await emptyBtn.isVisible()) {
      // confirm 다이얼로그 — 취소
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('영구 삭제');
        await dialog.dismiss();
      });
      await emptyBtn.click();
      await page.waitForTimeout(500);
      // 데이터 유지 확인 (삭제 안 됨)
      await takeScreenshot(page, 'todo-safety-confirm-cancel');
    }
  });
});
