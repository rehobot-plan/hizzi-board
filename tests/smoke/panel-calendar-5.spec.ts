// tests/smoke/panel-calendar-5.spec.ts
// 블록 ⑤-1 — 패널 달력 피어 탭 회귀. 본인 패널(월 그리드 + scope 토글) vs 타인 패널(placeholder) 분기 · FAB · redirect · TabBar 부재.
// 타인 패널 scope/privacy 정제는 ⑤-3(master-debt 후속)으로 이관.

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';
import { ensureAdminPanel } from '../e2e/helpers/chat-input';

test.describe('블록 ⑤-1 — 패널 달력 피어 탭', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    await page.locator('[data-testid="panel-container"]').first().waitFor({ state: 'visible', timeout: 30000 });
  });

  test('시나리오 1: 각 패널에 "달력" 피어 탭 노출', async ({ page }) => {
    const tabs = page.locator('[data-testid="panel-tab-calendar"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('시나리오 2: 타인 패널 달력 탭 → placeholder + scope 토글 부재 + FAB "일정 추가" aria', async ({ page }) => {
    // admin 로그인 · 일반 panels는 admin owner 아님 → 첫 패널이 타인 패널로 간주.
    const panel = page.locator('[data-testid="panel-container"]').first();
    await panel.locator('[data-testid="panel-tab-calendar"]').click();
    await expect(panel.locator('[data-testid="panel-calendar-placeholder"]')).toBeVisible();
    await expect(panel.locator('[data-testid="calendar-scope-toggle"]')).toHaveCount(0);
    // FAB는 달력 탭에서 "일정 추가" aria-label
    const fab = panel.locator('[data-testid="panel-fab"]');
    const label = await fab.getAttribute('aria-label');
    expect(label).toBe('일정 추가');
  });

  test('시나리오 3: 본인 패널 달력 탭 → 월 그리드 + scope 토글 노출 (seed admin owner)', async ({ page }) => {
    await ensureAdminPanel();
    await page.reload();
    await page.locator('[data-testid="panel-container"]').first().waitFor({ state: 'visible', timeout: 30000 });
    // admin seed panel 식별 — data-panel-id 속성 사용
    const adminPanel = page.locator('[data-testid="panel-container"][data-panel-id="test-s6-admin-panel"]').first();
    await adminPanel.locator('[data-testid="panel-tab-calendar"]').click();
    await expect(adminPanel.locator('[data-testid="calendar-scope-toggle"]')).toBeVisible();
    await expect(adminPanel.locator('[data-testid="calendar-scope-me"]')).toBeVisible();
    await expect(adminPanel.locator('[data-testid="calendar-scope-team"]')).toBeVisible();
    await expect(adminPanel.locator('[data-testid="panel-calendar-placeholder"]')).toHaveCount(0);
  });

  test('시나리오 4: /mydesk/calendar → 홈 redirect (legacy deep link)', async ({ page }) => {
    await page.goto('/mydesk/calendar');
    await page.waitForURL(/\/$/, { timeout: 10000 });
  });

  test('시나리오 5: MY DESK TabBar에 달력 탭 부재', async ({ page }) => {
    await page.goto('/mydesk/today');
    await page.locator('[data-testid="mydesk-tabbar"]').waitFor({ state: 'visible', timeout: 15000 });
    const tabbar = page.locator('[data-testid="mydesk-tabbar"]');
    const calendarTab = tabbar.locator('button').filter({ hasText: '달력' });
    await expect(calendarTab).toHaveCount(0);
  });

  test('시나리오 6: 달력 탭 활성 시 스크롤 예외 — overflowY:visible + paddingBottom:0', async ({ page }) => {
    const panel = page.locator('[data-testid="panel-container"]').first();
    await panel.locator('[data-testid="panel-tab-calendar"]').click();
    const scroll = panel.locator('[data-testid="panel-scroll"]');
    const styles = await scroll.evaluate(el => ({
      overflowY: getComputedStyle(el).overflowY,
      paddingBottom: getComputedStyle(el).paddingBottom,
    }));
    expect(styles.overflowY).toBe('visible');
    expect(styles.paddingBottom).toBe('0px');
  });

  test('시나리오 7: 메모 탭 복귀 시 기존 동작 회귀 없음 (탭 전환)', async ({ page }) => {
    const panel = page.locator('[data-testid="panel-container"]').first();
    // 달력 → 메모 전환
    await panel.locator('[data-testid="panel-tab-calendar"]').click();
    await expect(panel.locator('[data-testid="panel-calendar-placeholder"]')).toBeVisible();
    const memoTab = panel.locator('button').filter({ hasText: '메모' }).first();
    await memoTab.click();
    // 메모 탭 활성 후 placeholder 사라짐 + 기본 scroll 영역 복귀(auto)
    await expect(panel.locator('[data-testid="panel-calendar-placeholder"]')).toHaveCount(0);
    const scroll = panel.locator('[data-testid="panel-scroll"]');
    const overflow = await scroll.evaluate(el => getComputedStyle(el).overflowY);
    expect(overflow).toBe('auto');
  });
});
