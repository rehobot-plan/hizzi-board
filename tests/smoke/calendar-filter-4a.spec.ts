import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';

test.describe('Phase 4-A: 홈 달력 필터 신규 도입 (세션 #50)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    // localStorage 초기화 후 재진입 — 필터가 깨끗한 기본값으로 마운트
    await page.evaluate(() => window.localStorage.removeItem('hizzi.calendar.filter.team'));
    await page.reload();
    const toggle = page.locator('[data-testid="calendar-filter-toggle"]');
    await toggle.waitFor({ state: 'visible' });
    // users 로드까지 대기 — 드롭다운을 열어 담당자 체크박스가 ≥1개 렌더될 때까지 기다림
    await toggle.click();
    await page.locator('[data-testid^="calendar-filter-member-"]').first().waitFor({ state: 'visible', timeout: 10000 });
    // 라벨이 기본 상태("필터 ▾")임을 확인
    await expect(toggle).toContainText('필터 ▾');
    // 드롭다운 닫고 각 테스트가 스스로 열도록
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.locator('[data-testid="calendar-filter-dropdown"]').waitFor({ state: 'hidden' });
  });

  test('시나리오 1: 필터 토글 버튼 존재, 기본 라벨 "필터 ▾"', async ({ page }) => {
    const toggle = page.locator('[data-testid="calendar-filter-toggle"]');
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText('필터');
  });

  test('시나리오 2: 드롭다운 펼침 — 담당자 ≥1명 + 카테고리 3 체크박스 기본 체크', async ({ page }) => {
    await page.locator('[data-testid="calendar-filter-toggle"]').click();
    const dropdown = page.locator('[data-testid="calendar-filter-dropdown"]');
    await expect(dropdown).toBeVisible();

    const memberCheckboxes = dropdown.locator('[data-testid^="calendar-filter-member-"] input[type="checkbox"]');
    const memberCount = await memberCheckboxes.count();
    expect(memberCount).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < memberCount; i++) {
      await expect(memberCheckboxes.nth(i)).toBeChecked();
    }

    for (const cat of ['work', 'request', 'personal']) {
      const cb = dropdown.locator(`[data-testid="calendar-filter-category-${cat}"] input[type="checkbox"]`);
      await expect(cb).toBeChecked();
    }
  });

  test('시나리오 3: 담당자 1명 해제 → 라벨 "필터 • 1"로 변경', async ({ page }) => {
    const toggle = page.locator('[data-testid="calendar-filter-toggle"]');
    await toggle.click();
    const firstMember = page.locator('[data-testid^="calendar-filter-member-"]').first();
    await firstMember.locator('input[type="checkbox"]').uncheck();
    await expect(toggle).toContainText('필터 • 1');
  });

  test('시나리오 4: 카테고리 "업무" 해제 → 체크 상태 false', async ({ page }) => {
    await page.locator('[data-testid="calendar-filter-toggle"]').click();
    const workCb = page.locator('[data-testid="calendar-filter-category-work"] input[type="checkbox"]');
    await workCb.uncheck();
    await expect(workCb).not.toBeChecked();
  });

  test('시나리오 5: "전체 해제"(담당자) → 모든 담당자 체크박스 해제', async ({ page }) => {
    const toggle = page.locator('[data-testid="calendar-filter-toggle"]');
    await toggle.click();
    await page.locator('[data-testid="calendar-filter-members-clear"]').click({ force: true });
    await expect(toggle).toContainText('필터 • 1');
    const memberCheckboxes = page.locator('[data-testid^="calendar-filter-member-"] input[type="checkbox"]');
    const count = await memberCheckboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(memberCheckboxes.nth(i)).not.toBeChecked();
    }
  });

  test('시나리오 6: "기본값으로 초기화" → 라벨 "필터 ▾" 복귀', async ({ page }) => {
    const toggle = page.locator('[data-testid="calendar-filter-toggle"]');
    await toggle.click();
    await page.locator('[data-testid="calendar-filter-members-clear"]').click({ force: true });
    await expect(toggle).toContainText('필터 •');
    await page.locator('[data-testid="calendar-filter-reset"]').click({ force: true });
    await expect(toggle).toContainText('필터 ▾');
  });

  test('시나리오 7: 드롭다운 닫기 후 새로고침 → localStorage에 저장된 상태 복원', async ({ page }) => {
    await page.locator('[data-testid="calendar-filter-toggle"]').click();
    const workCb = page.locator('[data-testid="calendar-filter-category-work"] input[type="checkbox"]');
    await workCb.uncheck();
    // 바깥 클릭으로 드롭다운 닫기 → persist 호출
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.locator('[data-testid="calendar-filter-dropdown"]').waitFor({ state: 'hidden' });

    // localStorage 직접 확인
    const stored = await page.evaluate(() =>
      window.localStorage.getItem('hizzi.calendar.filter.team'),
    );
    expect(stored).not.toBeNull();
    const parsed = stored ? JSON.parse(stored) : null;
    expect(Array.isArray(parsed.categories)).toBe(true);
    expect(parsed.categories).not.toContain('work');

    // 새로고침 후 체크 상태 복원
    await page.reload();
    await page.locator('[data-testid="calendar-filter-toggle"]').click();
    await expect(
      page.locator('[data-testid="calendar-filter-category-work"] input[type="checkbox"]'),
    ).not.toBeChecked();
  });

  test('시나리오 8: CalendarGrid 렌더 회귀 없음 (필터 UI 추가 후에도 달력 정상 표시)', async ({ page }) => {
    // FullCalendar가 정상 렌더됐는지 셀 존재로 확인 (필터 통합으로 인한 렌더 회귀 방지)
    const dayCells = page.locator('.fc-daygrid-day');
    const count = await dayCells.count();
    expect(count).toBeGreaterThan(20);
    // toolbar 연/월 표시 존재 (이벤트 추가 UI와 무관한 구조적 회귀 확인)
    await expect(page.getByText(/\d{4}년/).first()).toBeVisible();
  });
});
