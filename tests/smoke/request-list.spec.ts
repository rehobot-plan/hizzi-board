import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';
import { takeScreenshot } from '../utils/screenshot';

test.describe('요청 목록', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('요청 페이지 목록 렌더', async ({ page }) => {
    await page.goto('/request');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
    // 페이지 제목
    await expect(page.locator('h1')).toHaveText('요청 관리');
    // 탭 또는 전체보기 토글 노출
    const hasToggle = await page.locator('text=전체 보기').isVisible().catch(() => false);
    const hasTab = await page.locator('text=받은 요청').isVisible().catch(() => false);
    expect(hasToggle || hasTab).toBeTruthy();
    await takeScreenshot(page, 'request-list');
  });

  test('전체 보기 토글 (admin)', async ({ page }) => {
    await page.goto('/request');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
    const toggle = page.locator('text=전체 보기');
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'request-list-all');
    }
  });
});
