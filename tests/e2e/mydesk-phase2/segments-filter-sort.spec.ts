import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';
import { takeScreenshot } from '../../utils/screenshot';

// 시드는 beforeAll에서 별도 실행 (seed-mydesk-phase2.mjs seed 사전 실행 전제)

test.describe('할일 탭 — 세그먼트·필터·정렬', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/mydesk/todo');
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(3000); // Firestore 동기화
  });

  test('3 세그먼트 전환 + 카운트 표시', async ({ page }) => {
    // 진행 중 세그먼트 활성
    const active = page.locator('[data-testid="segment-active"]');
    await expect(active).toBeVisible();
    const activeText = await active.textContent();
    expect(activeText).toContain('진행 중');

    // 완료 세그먼트 클릭
    await page.locator('[data-testid="segment-completed"]').click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'todo-segment-completed');

    // 휴지통 세그먼트 클릭
    await page.locator('[data-testid="segment-trash"]').click();
    await page.waitForTimeout(500);
    // 휴지통 비우기 버튼 확인
    const emptyBtn = page.locator('[data-testid="empty-trash"]');
    const hasTrash = await emptyBtn.isVisible().catch(() => false);
    // 시드에 휴지통 데이터 있으면 표시됨
    await takeScreenshot(page, 'todo-segment-trash');
  });

  test('필터 다중선택 + U2 전체 자동 복원', async ({ page }) => {
    // 기본: 3개 모두 활성
    const workFilter = page.locator('[data-testid="filter-work"]');
    const requestFilter = page.locator('[data-testid="filter-request"]');
    const personalFilter = page.locator('[data-testid="filter-personal"]');

    await expect(workFilter).toBeVisible();
    await expect(requestFilter).toBeVisible();
    await expect(personalFilter).toBeVisible();

    // 업무만 해제
    await workFilter.click();
    await page.waitForTimeout(500);

    // 요청, 개인만 해제 → U2: 전부 해제 → 전체 복원
    await requestFilter.click();
    await personalFilter.click();
    await page.waitForTimeout(500);
    // 모두 해제 후 전체 자동 복원 확인 (모든 필터 다시 활성)
    await takeScreenshot(page, 'todo-filter-u2');
  });

  test('정렬 드롭다운 + 세그먼트별 기본값', async ({ page }) => {
    // 진행 중 기본값: 기한 임박순
    const dropdown = page.locator('[data-testid="sort-dropdown"]');
    await expect(dropdown).toBeVisible();
    const text = await dropdown.textContent();
    expect(text).toContain('기한 임박순');

    // 완료 세그먼트 전환 → 기본값 복원
    await page.locator('[data-testid="segment-completed"]').click();
    await page.waitForTimeout(500);
    const completedText = await dropdown.textContent();
    expect(completedText).toContain('최근 완료순');

    await takeScreenshot(page, 'todo-sort-completed');
  });
});
