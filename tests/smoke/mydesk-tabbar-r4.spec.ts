import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../utils/auth'

test.describe('Phase R-4: MY DESK TabBar 5탭 (요청 탭 추가, 세션 #49)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mydesk/today')
    await page.locator('[data-testid="sidebar"]').waitFor({ state: 'visible' })
    await page.waitForTimeout(1000)
  })

  test('시나리오 1: TabBar 5탭 순서 [오늘/요청/할일/메모/달력]', async ({ page }) => {
    const tabbar = page.locator('[data-testid="mydesk-tabbar"]')
    const buttons = tabbar.locator('button')
    await expect(buttons).toHaveCount(5)
    await expect(buttons.nth(0)).toHaveText('오늘')
    await expect(buttons.nth(1)).toHaveText('요청')
    await expect(buttons.nth(2)).toHaveText('할일')
    await expect(buttons.nth(3)).toHaveText('메모')
    await expect(buttons.nth(4)).toHaveText('달력')
  })

  test('시나리오 2: /mydesk/request 진입 → "요청" 탭 활성', async ({ page }) => {
    await page.goto('/mydesk/request')
    await page.waitForTimeout(500)
    const tabbar = page.locator('[data-testid="mydesk-tabbar"]')
    const active = tabbar.locator('button').filter({ hasText: '요청' }).first()
    // 활성 탭은 borderBottom #C17B6B
    const borderColor = await active.evaluate((el) => window.getComputedStyle(el).borderBottomColor)
    expect(borderColor).toBe('rgb(193, 123, 107)')
    // 비활성 탭 예시 (할일)
    const inactive = tabbar.locator('button').filter({ hasText: '할일' }).first()
    const inactiveBorder = await inactive.evaluate((el) => window.getComputedStyle(el).borderBottomColor)
    expect(inactiveBorder).not.toBe('rgb(193, 123, 107)')
  })

  test('시나리오 3: /request 진입 → TabBar 미렌더 (단독 RequestView)', async ({ page }) => {
    await page.goto('/request')
    await page.waitForTimeout(500)
    await expect(page.locator('[data-testid="mydesk-tabbar"]')).toHaveCount(0)
    // RequestView는 렌더
    await expect(page.getByRole('heading', { name: '요청 관리' })).toBeVisible()
  })

  test('시나리오 4: /mydesk/request와 /request 모두 동일 Header 렌더 (고정문구 "Hizzi is happy, and you?")', async ({ page }) => {
    await page.goto('/mydesk/request')
    await expect(page.locator('header').getByText('Hizzi is happy, and you?')).toBeVisible()
    await page.goto('/request')
    await expect(page.locator('header').getByText('Hizzi is happy, and you?')).toBeVisible()
  })

  test('시나리오 5: 탭 클릭 → URL 이동 + 새로고침 후 활성 유지', async ({ page }) => {
    await page.locator('[data-testid="mydesk-tabbar"] button').filter({ hasText: '메모' }).click()
    await page.waitForURL(/\/mydesk\/memo/, { timeout: 10000 })
    await page.reload()
    await page.waitForTimeout(500)
    const active = page.locator('[data-testid="mydesk-tabbar"] button').filter({ hasText: '메모' })
    const borderColor = await active.evaluate((el) => window.getComputedStyle(el).borderBottomColor)
    expect(borderColor).toBe('rgb(193, 123, 107)')
  })

  test('시나리오 6: 모바일 375px — TabBar 가로 스크롤 허용 + 활성 탭 뷰포트 내 표시', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/mydesk/calendar')
    await page.waitForTimeout(800)
    const tabbar = page.locator('[data-testid="mydesk-tabbar"]')
    const overflowX = await tabbar.evaluate((el) => window.getComputedStyle(el).overflowX)
    expect(overflowX).toBe('auto')
    // 활성 탭(달력)이 뷰포트 내에 보이는지 — scrollIntoView 자동 실행
    const active = tabbar.locator('button').filter({ hasText: '달력' })
    const box = await active.boundingBox()
    expect(box).not.toBeNull()
    // 뷰포트 x 범위 내
    expect(box!.x).toBeGreaterThanOrEqual(-10)
    expect(box!.x + box!.width).toBeLessThanOrEqual(385)
  })
})
