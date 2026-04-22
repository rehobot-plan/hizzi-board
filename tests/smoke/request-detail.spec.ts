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

test.describe('요청 상세 팝업', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/request');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('받은 요청 탭 — 시드 데이터 3건 표시', async ({ page }) => {
    // 받은 요청 탭 (기본)
    await page.waitForTimeout(2000); // Firestore 동기화 대기
    const items = page.locator('[style*="border-left: 2px solid"]');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('보낸 요청 탭 — 시드 데이터 3건 표시', async ({ page }) => {
    await page.locator('text=보낸 요청').click();
    await page.waitForTimeout(2000);
    const items = page.locator('[style*="border-left: 2px solid"]');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('전체 보기 — 시드 데이터 6건 표시', async ({ page }) => {
    await page.locator('text=전체 보기').click();
    await page.waitForTimeout(2000);
    const items = page.locator('[style*="border-left: 2px solid"]');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(6);
    await takeScreenshot(page, 'request-all-view');
  });

  test('pending 아이템 클릭 → 팝업 열림', async ({ page }) => {
    await page.waitForTimeout(2000);
    // __test_seed_ 접두어 아이템 클릭
    const item = page.locator('text=촬영 일정 조율').first();
    await item.click();
    // 팝업 열림 확인
    const popup = page.locator('[role="dialog"]');
    await expect(popup).toBeVisible({ timeout: 5000 });
    await expect(popup.locator('text=대기')).toBeVisible();
    await expect(popup.locator('text=촬영 일정 조율')).toBeVisible();
    await takeScreenshot(page, 'request-detail-pending');
  });

  test('accepted 아이템 → 댓글 타임라인 확인', async ({ page }) => {
    // 보낸 요청 탭으로 전환
    await page.locator('text=보낸 요청').click();
    await page.waitForTimeout(2000);
    const item = page.locator('text=룩북 촬영 준비').first();
    await item.click();
    const popup = page.locator('[role="dialog"]');
    await expect(popup).toBeVisible({ timeout: 5000 });
    await expect(popup.locator('text=수락됨')).toBeVisible();
    // 댓글 확인
    await expect(popup.locator('text=촬영 장소 확정됐나요?')).toBeVisible({ timeout: 5000 });
    await expect(popup.locator('text=홍대 스튜디오로 잡았어요')).toBeVisible();
    await takeScreenshot(page, 'request-detail-accepted-comments');
  });

  test('cancel_requested 아이템 → 취소 대기 뱃지', async ({ page }) => {
    await page.waitForTimeout(2000);
    const item = page.locator('text=홍보 일정 변경 요청').first();
    await item.click();
    const popup = page.locator('[role="dialog"]');
    await expect(popup).toBeVisible({ timeout: 5000 });
    await expect(popup.locator('text=취소 대기')).toBeVisible();
    await takeScreenshot(page, 'request-detail-cancel-requested');
  });

  test('ESC로 팝업 닫기', async ({ page }) => {
    await page.waitForTimeout(2000);
    const item = page.locator('text=촬영 일정 조율').first();
    await item.click();
    const popup = page.locator('[role="dialog"]');
    await expect(popup).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await expect(popup).not.toBeVisible({ timeout: 3000 });
  });

  test('백드롭 클릭으로 팝업 닫기', async ({ page }) => {
    await page.waitForTimeout(2000);
    const item = page.locator('text=촬영 일정 조율').first();
    await item.click();
    const popup = page.locator('[role="dialog"]');
    await expect(popup).toBeVisible({ timeout: 5000 });
    // Radix overlay 클릭 (fixed overlay 위 좌상단)
    await page.mouse.click(5, 5);
    await expect(popup).not.toBeVisible({ timeout: 3000 });
  });
});
