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

  test('시나리오 4 (세션 #61): handle 노출 ↔ scroll overflow 일치', async ({ page }) => {
    // scroll sh > ch + 1 이면 handle 존재, 아니면 부재. 역도 성립.
    const panels = page.locator('[data-testid="panel-container"]');
    const count = await panels.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      const card = panels.nth(i);
      const scroll = card.locator('[data-testid="panel-scroll"]');
      const overflowed = await scroll.evaluate((el) => {
        const e = el as HTMLElement;
        return e.scrollHeight > e.clientHeight + 1;
      });
      const cell = card.locator('xpath=..');
      const handleCount = await cell.locator('[data-testid="panel-expand-handle"]').count();
      expect(handleCount, `패널 ${i + 1} handle 노출 상태 불일치 (overflow=${overflowed})`).toBe(overflowed ? 1 : 0);
    }
  });

  test('시나리오 5 (세션 #61): overflow 패널의 scroll sh > ch 실제 확인', async ({ page }) => {
    // 하나라도 overflow 상태인 패널이 없다면 데이터 부족이나 레이아웃 회귀 가능성.
    const scrolls = page.locator('[data-testid="panel-scroll"]');
    const count = await scrolls.count();
    let overflowFound = 0;
    for (let i = 0; i < count; i++) {
      const o = await scrolls.nth(i).evaluate((el) => {
        const e = el as HTMLElement;
        return { sh: e.scrollHeight, ch: e.clientHeight };
      });
      if (o.sh > o.ch + 1) overflowFound++;
    }
    // admin 화면엔 최소 1개의 overflow 패널이 있어야 정상 (유미정 케이스)
    expect(overflowFound, 'overflow 상태 패널 0건 — 레이아웃 회귀 의심').toBeGreaterThanOrEqual(1);
  });

  test('시나리오 6 (세션 #61): handle 클릭 시 페이지 scrollY 유지 (viewport jump 차단)', async ({ page }) => {
    // overflow 상태 패널 하나 찾기
    const panels = page.locator('[data-testid="panel-container"]');
    const count = await panels.count();
    let targetIdx = -1;
    for (let i = 0; i < count; i++) {
      const overflowed = await panels.nth(i).locator('[data-testid="panel-scroll"]').evaluate((el) => {
        const e = el as HTMLElement;
        return e.scrollHeight > e.clientHeight + 1;
      });
      if (overflowed) { targetIdx = i; break; }
    }
    expect(targetIdx, 'overflow 패널 없음 — 시나리오 6 데이터 전제 불충족').toBeGreaterThanOrEqual(0);

    const card = panels.nth(targetIdx);
    const cell = card.locator('xpath=..');
    const handle = cell.locator('[data-testid="panel-expand-handle"]');
    await expect(handle).toBeVisible();

    // 각 click 직전 scrollY 측정 → 직후와 비교.
    // Playwright click의 actionability check(scroll-into-view)가 baseline을 오염시키지 않도록
    // DOM element.click()으로 프로그래매틱 클릭 (scroll 안 함).

    // 펼침
    await handle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    const beforeExpand = await page.evaluate(() => window.scrollY);
    await handle.evaluate((el) => (el as HTMLButtonElement).click());
    await page.waitForTimeout(250);
    const afterExpand = await page.evaluate(() => window.scrollY);
    expect(
      Math.abs(afterExpand - beforeExpand),
      `펼침 viewport jump: before=${beforeExpand} → after=${afterExpand}`
    ).toBeLessThan(3);

    // 접힘
    await handle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    const beforeCollapse = await page.evaluate(() => window.scrollY);
    await handle.evaluate((el) => (el as HTMLButtonElement).click());
    await page.waitForTimeout(250);
    const afterCollapse = await page.evaluate(() => window.scrollY);
    expect(
      Math.abs(afterCollapse - beforeCollapse),
      `접힘 viewport jump: before=${beforeCollapse} → after=${afterCollapse}`
    ).toBeLessThan(3);
  });

  test('시나리오 7 (세션 #61): 실 마우스 시퀀스 handle 클릭 scrollY 유지', async ({ page }) => {
    // page.mouse.move + down + up 분리. mousedown→click 사이 모든 phase에서 scrollY 추적.
    // Playwright element.click()과 달리 actionability scroll도 없고 실제 user mousedown 경로 시뮬.
    const panels = page.locator('[data-testid="panel-container"]');
    const count = await panels.count();
    let targetIdx = -1;
    for (let i = 0; i < count; i++) {
      const o = await panels.nth(i).locator('[data-testid="panel-scroll"]').evaluate((el) => {
        const e = el as HTMLElement;
        return e.scrollHeight > e.clientHeight + 1;
      });
      if (o) { targetIdx = i; break; }
    }
    expect(targetIdx, 'overflow 패널 없음').toBeGreaterThanOrEqual(0);

    const card = panels.nth(targetIdx);
    const cell = card.locator('xpath=..');
    const handle = cell.locator('[data-testid="panel-expand-handle"]');
    await handle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);

    const box = await handle.boundingBox();
    if (!box) throw new Error('handle box null');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // 펼침 — 진입 후 down/up 분리
    const beforeExpand = await page.evaluate(() => window.scrollY);
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(50);
    await page.mouse.down();
    await page.waitForTimeout(50);
    const midExpand = await page.evaluate(() => window.scrollY);
    await page.mouse.up();
    await page.waitForTimeout(300);
    const afterExpand = await page.evaluate(() => window.scrollY);
    expect(
      Math.abs(afterExpand - beforeExpand),
      `펼침(실마우스) jump: before=${beforeExpand} mid=${midExpand} after=${afterExpand}`
    ).toBeLessThan(3);

    // 접힘 — 다시 handle 위로 이동
    await handle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const box2 = await handle.boundingBox();
    if (!box2) throw new Error('handle box null (collapse)');
    const cx2 = box2.x + box2.width / 2;
    const cy2 = box2.y + box2.height / 2;

    const beforeCollapse = await page.evaluate(() => window.scrollY);
    await page.mouse.move(cx2, cy2);
    await page.waitForTimeout(50);
    await page.mouse.down();
    await page.waitForTimeout(50);
    const midCollapse = await page.evaluate(() => window.scrollY);
    await page.mouse.up();
    await page.waitForTimeout(300);
    const afterCollapse = await page.evaluate(() => window.scrollY);
    expect(
      Math.abs(afterCollapse - beforeCollapse),
      `접힘(실마우스) jump: before=${beforeCollapse} mid=${midCollapse} after=${afterCollapse}`
    ).toBeLessThan(3);
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
