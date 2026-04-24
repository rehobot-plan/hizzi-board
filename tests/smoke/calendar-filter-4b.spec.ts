import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';

// 세션 #70 블록 ⑤: /mydesk/calendar 경로 폐지. 달력은 패널 피어 탭으로 내재화.
// panelMode에서는 기존 CalendarFilter 숨김(scope 이진 토글이 대체) → 본 describe 전체 legacy.
test.describe.skip('Phase 4-B: MY DESK 달력 탭 활성화 (세션 #51) — 블록 ⑤로 폐지', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    // 양쪽 scope localStorage 초기화
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.removeItem('hizzi.calendar.filter.team');
      window.localStorage.removeItem('hizzi.calendar.filter.me');
    });
  });

  test('시나리오 1: MY DESK 달력 탭 — placeholder 제거, 필터 토글 노출', async ({ page }) => {
    await page.goto('/mydesk/calendar');
    await expect(page.getByText('달력 탭 준비 중입니다.')).toHaveCount(0);
    const toggle = page.locator('[data-testid="calendar-filter-toggle"]');
    await toggle.waitFor({ state: 'visible', timeout: 10000 });
  });

  test('시나리오 2: MY DESK 최초 진입 시 담당자 = 본인만 체크 상태 (scope=me 기본값)', async ({ page }) => {
    await page.goto('/mydesk/calendar');
    const toggle = page.locator('[data-testid="calendar-filter-toggle"]');
    await toggle.waitFor({ state: 'visible', timeout: 10000 });
    await toggle.click();
    // 본인(admin@company.com)만 체크
    const selfCheckbox = page.locator('[data-testid="calendar-filter-member-admin@company.com"] input[type="checkbox"]');
    await expect(selfCheckbox).toBeChecked();
    // scope=me 기본값이 "본인만"이므로 deviation=0 → 라벨 "필터 ▾" (4-A scope=team과 의미 다름)
    await expect(toggle).toContainText('필터 ▾');
    // 나머지 멤버는 해제 상태 (admin 외 최소 1명 이상 존재 가정)
    const memberCheckboxes = page.locator('[data-testid^="calendar-filter-member-"] input[type="checkbox"]');
    const total = await memberCheckboxes.count();
    let uncheckedCount = 0;
    for (let i = 0; i < total; i++) {
      if (!(await memberCheckboxes.nth(i).isChecked())) uncheckedCount++;
    }
    expect(uncheckedCount).toBeGreaterThanOrEqual(1);
    // 카테고리는 전체 체크 유지
    for (const cat of ['work', 'request', 'personal']) {
      const cb = page.locator(`[data-testid="calendar-filter-category-${cat}"] input[type="checkbox"]`);
      await expect(cb).toBeChecked();
    }
  });

  test('시나리오 3: 홈 ↔ MY DESK 필터 상호 독립 — 한쪽 조정이 다른 쪽에 영향 없음', async ({ page }) => {
    // MY DESK 진입 → 드롭다운 열어 users 로드 + 기본값 저장 유도
    await page.goto('/mydesk/calendar');
    const toggle = page.locator('[data-testid="calendar-filter-toggle"]');
    await toggle.waitFor({ state: 'visible', timeout: 10000 });
    await toggle.click();
    // 카테고리 "업무" 해제
    await page.locator('[data-testid="calendar-filter-category-work"] input[type="checkbox"]').uncheck();
    // 드롭다운 닫아 persist 유도
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.locator('[data-testid="calendar-filter-dropdown"]').waitFor({ state: 'hidden' });

    // me 키 저장됐는지 확인, team 키는 영향 없음
    const stored = await page.evaluate(() => ({
      me: window.localStorage.getItem('hizzi.calendar.filter.me'),
      team: window.localStorage.getItem('hizzi.calendar.filter.team'),
    }));
    expect(stored.me).not.toBeNull();
    const meParsed = JSON.parse(stored.me!);
    expect(meParsed.categories).not.toContain('work');

    // 홈으로 이동 → 홈 필터는 기본값 유지 (카테고리 전체 체크)
    await page.goto('/');
    const homeToggle = page.locator('[data-testid="calendar-filter-toggle"]');
    await homeToggle.waitFor({ state: 'visible', timeout: 10000 });
    await homeToggle.click();
    // 홈 쪽 drop down에서 담당자 체크박스 렌더 완료까지 대기
    await page.locator('[data-testid^="calendar-filter-member-"]').first().waitFor({ state: 'visible' });
    // 홈 카테고리 "업무" 여전히 체크 (me 변경 독립성)
    await expect(
      page.locator('[data-testid="calendar-filter-category-work"] input[type="checkbox"]'),
    ).toBeChecked();
  });
});
