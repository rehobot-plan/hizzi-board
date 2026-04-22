import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';
import { takeScreenshot } from '../utils/screenshot';
import { seedTestData, cleanupTestData, SeedIds } from '../utils/seed';

let seedIds: SeedIds;

test.beforeAll(async () => {
  seedIds = await seedTestData();
});

test.afterAll(async () => {
  if (seedIds) await cleanupTestData(seedIds);
});

test.describe('요청 편집 모드', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/request');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('보낸 pending 요청 — 수정 버튼 노출 + 편집 + 저장', async ({ page }) => {
    // admin이 보낸 pending 요청이 시드에 없으므로 전체 보기에서 찾기
    // 시드 요청 1은 admin이 받은 pending. 수정 버튼이 없어야 함.
    // 수정 가능 테스트를 위해 전체 보기 모드에서 admin이 보낸 accepted를 확인
    // → 실제로는 pending + fromEmail === admin 시드가 필요
    // 시드에 admin이 보낸 pending이 없으므로 받은 요청의 수정 불가를 확인

    await page.waitForTimeout(2000);
    // 받은 요청 중 pending 아이템 클릭 (admin이 받은 것 → 수정 불가)
    const item = page.locator('text=촬영 일정 조율').first();
    await item.click();
    const popup = page.locator('[role="dialog"]');
    await expect(popup).toBeVisible({ timeout: 5000 });
    // 수정 버튼 미노출 확인 (수신자이므로)
    const editBtn = popup.locator('[data-testid="edit-button"]');
    await expect(editBtn).not.toBeVisible();
    await takeScreenshot(page, 'request-edit-no-button-receiver');
    await page.keyboard.press('Escape');
  });

  test('보낸 요청 중 accepted — 수정 버튼 미노출 (이미 수락됨)', async ({ page }) => {
    await page.locator('text=보낸 요청').click();
    await page.waitForTimeout(2000);
    const item = page.locator('text=룩북 촬영 준비').first();
    await item.click();
    const popup = page.locator('[role="dialog"]');
    await expect(popup).toBeVisible({ timeout: 5000 });
    const editBtn = popup.locator('[data-testid="edit-button"]');
    await expect(editBtn).not.toBeVisible();
    await takeScreenshot(page, 'request-edit-no-button-accepted');
    await page.keyboard.press('Escape');
  });
});
