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

test.describe('요청 타임라인', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/request');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('accepted 요청 — system + user 혼합 타임라인', async ({ page }) => {
    // 전체 보기 → accepted 요청 (시드 요청 2: 룩북 촬영 준비)
    await page.locator('text=전체 보기').click();
    await page.waitForTimeout(2000);
    await page.locator('text=룩북 촬영 준비').first().click();

    const popup = page.locator('[role="dialog"]');
    await expect(popup).toBeVisible({ timeout: 5000 });

    // 타임라인 영역
    const timeline = popup.locator('[data-testid="timeline"]');
    await expect(timeline).toBeVisible();

    // system 메시지 확인
    const systemItems = timeline.locator('[data-testid="timeline-system"]');
    await expect(systemItems).toHaveCount(1);
    await expect(systemItems.first()).toContainText('수락');

    // user 댓글 확인
    const userItems = timeline.locator('[data-testid="timeline-user"]');
    const userCount = await userItems.count();
    expect(userCount).toBeGreaterThanOrEqual(2);
    await expect(timeline.locator('text=촬영 장소 확정됐나요?')).toBeVisible();
    await expect(timeline.locator('text=홍대 스튜디오로 잡았어요')).toBeVisible();

    await takeScreenshot(page, 'request-timeline-mixed');
  });

  test('댓글 입력 → 타임라인에 추가', async ({ page }) => {
    await page.locator('text=전체 보기').click();
    await page.waitForTimeout(2000);
    await page.locator('text=룩북 촬영 준비').first().click();

    const popup = page.locator('[role="dialog"]');
    await expect(popup).toBeVisible({ timeout: 5000 });

    // 댓글 입력
    const input = popup.locator('input[placeholder="메모를 남겨주세요..."]');
    await input.fill('테스트 댓글입니다');
    await popup.locator('button:has-text("전송")').click();
    await page.waitForTimeout(2000);

    // 새 댓글이 타임라인에 추가됨
    await expect(popup.locator('text=테스트 댓글입니다')).toBeVisible();
    await takeScreenshot(page, 'request-timeline-after-comment');

    // 정리: 추가한 댓글 삭제
    const deleteBtn = popup.locator('text=테스트 댓글입니다').locator('..').locator('..').locator('text=삭제');
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(1000);
    }
  });
});
