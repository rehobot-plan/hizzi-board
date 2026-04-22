import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';
import { takeScreenshot } from '../utils/screenshot';

test.describe('사이드바 공통 레이아웃', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('메인 페이지에 사이드바 노출', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('text=HIZZI BOARD')).toBeVisible();
    await expect(sidebar.locator('text=홈')).toBeVisible();
    await expect(sidebar.locator('text=MY DESK')).toBeVisible();
    await expect(sidebar.locator('text=기타')).toBeVisible();
    await takeScreenshot(page, 'sidebar-main');
  });

  test.skip('연차 페이지에 사이드바 노출 (leaveViewPermission 필요)', async ({ page }) => {
    await page.goto('/leave');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('text=HIZZI BOARD')).toBeVisible();
    await takeScreenshot(page, 'sidebar-leave');
  });

  test('요청 페이지에 사이드바 노출', async ({ page }) => {
    await page.goto('/request');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('text=HIZZI BOARD')).toBeVisible();
    await takeScreenshot(page, 'sidebar-request');
  });

  test('MY DESK 클릭으로 mydesk 이동', async ({ page }) => {
    await page.locator('aside').locator('text=MY DESK').click();
    await page.waitForURL(/\/mydesk/, { timeout: 10000 });
    expect(page.url()).toContain('/mydesk');
  });

  test('HIZZI BOARD 클릭으로 메인 복귀', async ({ page }) => {
    await page.goto('/request');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('aside').locator('text=HIZZI BOARD').click();
    await page.waitForURL('/', { timeout: 10000 });
    expect(page.url()).toMatch(/\/$/);
  });
});
