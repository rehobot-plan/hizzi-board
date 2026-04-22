import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../utils/auth'

test.describe('Phase H-2: MY DESK TabBar sticky 검증 (세션 #46)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('시나리오 1: /mydesk/today — TabBar 렌더 + sticky top 72', async ({ page }) => {
    await page.goto('/mydesk/today')
    const tabbar = page.locator('[data-testid="mydesk-tabbar"]')
    await expect(tabbar).toBeVisible()
    const pos = await tabbar.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return { position: cs.position, top: cs.top, background: cs.backgroundColor }
    })
    expect(pos.position).toBe('sticky')
    expect(pos.top).toBe('72px')
    expect(pos.background).toBe('rgb(253, 248, 244)')
  })

  test('시나리오 2: 스크롤 후 Header + TabBar 상단 스택 고정', async ({ page }) => {
    await page.goto('/mydesk/today')
    // 스크롤 강제 발생용 — TabBar 아래 콘텐츠 wrapper에 실제 높이 주입 (body scroll 유도)
    await page.evaluate(() => {
      const content = document.querySelector('.px-8.pb-8')
      if (content instanceof HTMLElement) {
        content.style.minHeight = '3000px'
      }
    })
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(300)

    const header = page.locator('header').first()
    const tabbar = page.locator('[data-testid="mydesk-tabbar"]')
    const headerBox = await header.boundingBox()
    const tabbarBox = await tabbar.boundingBox()
    expect(headerBox).not.toBeNull()
    expect(tabbarBox).not.toBeNull()
    // Header는 viewport top:0 근처에 고정
    expect(headerBox!.y).toBeLessThanOrEqual(1)
    // TabBar는 Header 바로 아래(top 72 근처)에 고정
    expect(tabbarBox!.y).toBeGreaterThanOrEqual(70)
    expect(tabbarBox!.y).toBeLessThanOrEqual(74)
  })

  test('시나리오 3: /mydesk/* 외 경로(/request) — TabBar 미렌더', async ({ page }) => {
    await page.goto('/request')
    await expect(page.locator('[data-testid="mydesk-tabbar"]')).toHaveCount(0)
  })
})
