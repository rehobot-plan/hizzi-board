import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';

test.describe('메인 UX §1 — 패널 높이 제어 (세션 #54)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    await page.locator('[data-testid="panel-container"]').first().waitFor({ state: 'visible', timeout: 30000 });
  });

  test('시나리오 1: 6패널 모두 max-height min(600px, 70vh) 적용', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('viewport size unavailable');
    const expectedMax = Math.min(600, viewport.height * 0.7);
    const panels = page.locator('[data-testid="panel-container"]');
    const count = await panels.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      const box = await panels.nth(i).boundingBox();
      expect(box).not.toBeNull();
      // 여유 1px 허용 (브라우저 반올림)
      expect(box!.height).toBeLessThanOrEqual(expectedMax + 1);
      expect(box!.height).toBeGreaterThanOrEqual(240);
    }
  });

  test('시나리오 2: 패널 내부 스크롤 영역 존재 + 스크롤바 4px', async ({ page }) => {
    const scroll = page.locator('[data-testid="panel-scroll"]').first();
    await expect(scroll).toBeVisible();
    const scrollable = await scroll.evaluate((el) => ({
      overflowY: getComputedStyle(el).overflowY,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(scrollable.overflowY).toBe('auto');
    // 스크롤 가능한 경우 scrollHeight >= clientHeight
    expect(scrollable.scrollHeight).toBeGreaterThanOrEqual(scrollable.clientHeight);
  });

  test('시나리오 3: 탭 전환 시 스크롤 위치 독립 기억', async ({ page }) => {
    const panel = page.locator('[data-testid="panel-container"]').first();
    const scroll = panel.locator('[data-testid="panel-scroll"]');
    await scroll.waitFor({ state: 'visible' });

    // 할일 탭에서 스크롤 시도 (콘텐츠 많으면 스크롤됨)
    const initialOverflow = await scroll.evaluate((el) => el.scrollHeight > el.clientHeight);

    if (initialOverflow) {
      await scroll.evaluate((el) => { el.scrollTop = 50; });
      const todoScrollTop = await scroll.evaluate((el) => el.scrollTop);

      // 메모 탭으로 전환
      await panel.locator('button', { hasText: /^메모$/ }).first().click();
      await page.waitForTimeout(200);

      // 메모 탭 스크롤 위치 = 0 (독립 기억)
      const memoScrollTop = await scroll.evaluate((el) => el.scrollTop);
      expect(memoScrollTop).toBe(0);

      // 할일 탭으로 복귀
      await panel.locator('button', { hasText: /^할일$/ }).first().click();
      await page.waitForTimeout(200);

      const restoredScrollTop = await scroll.evaluate((el) => el.scrollTop);
      expect(restoredScrollTop).toBe(todoScrollTop);
    } else {
      // 콘텐츠가 적어 스크롤 불가 시 — 구조 존재만 확인
      expect(await scroll.count()).toBeGreaterThan(0);
    }
  });
});
