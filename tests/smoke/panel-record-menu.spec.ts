// tests/smoke/panel-record-menu.spec.ts
// 블록 ③-B — 패널 탭 행 ··· 메뉴 + RecordModal 3층(windowFilter='all') 진입 회귀.
// visibleTo 필터(admin/본인/타인)는 postSelectors.canViewPost unit 테스트로 커버.

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';

test.describe('블록 ③-B — 패널 탭 ··· 메뉴 + RecordModal 3층', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    await page.locator('[data-testid="panel-container"]').first().waitFor({ state: 'visible', timeout: 30000 });
  });

  test('시나리오 1: 할일 탭 ··· 버튼 노출', async ({ page }) => {
    const btn = page.locator('[data-testid="panel-menu-button"]').first();
    await expect(btn).toBeVisible();
  });

  test('시나리오 2: ··· 클릭 → 팝오버 + "기록" 항목', async ({ page }) => {
    await page.locator('[data-testid="panel-menu-button"]').first().click();
    const popover = page.locator('[data-testid="panel-menu-popover"]').first();
    await expect(popover).toBeVisible();
    const recordItem = page.locator('[data-testid="panel-menu-record"]').first();
    await expect(recordItem).toBeVisible();
  });

  test('시나리오 3: 팝오버 ESC 닫힘', async ({ page }) => {
    await page.locator('[data-testid="panel-menu-button"]').first().click();
    const popover = page.locator('[data-testid="panel-menu-popover"]').first();
    await expect(popover).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="panel-menu-popover"]')).toHaveCount(0);
  });

  test('시나리오 4: 팝오버 바깥 클릭 닫힘', async ({ page }) => {
    await page.locator('[data-testid="panel-menu-button"]').first().click();
    const popover = page.locator('[data-testid="panel-menu-popover"]').first();
    await expect(popover).toBeVisible();
    // 바깥(body 상단) 클릭
    await page.mouse.click(5, 5);
    await expect(page.locator('[data-testid="panel-menu-popover"]')).toHaveCount(0);
  });

  test('시나리오 5: "기록" 클릭 → RecordModal(windowFilter="all") 노출 + 완료·휴지통 2탭', async ({ page }) => {
    await page.locator('[data-testid="panel-menu-button"]').first().click();
    await page.locator('[data-testid="panel-menu-record"]').first().click();
    // 3층은 windowLabel='전체'
    await expect(page.getByText(/RECORD · 전체/)).toBeVisible({ timeout: 3000 });
    // 할일 카테고리 → 완료·휴지통 2탭 모두 노출
    await expect(page.getByRole('button', { name: /완료 \(\d+\)/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /휴지통 \(\d+\)/ })).toBeVisible();
    // 모달 ESC 닫힘
    await page.keyboard.press('Escape');
    await expect(page.getByText(/RECORD · 전체/)).toBeHidden({ timeout: 3000 });
  });
});
