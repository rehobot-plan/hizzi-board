import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../utils/auth'
import { seedTestData, cleanupTestData, SeedIds } from '../utils/seed'

let seedIds: SeedIds

test.beforeAll(async () => {
  seedIds = await seedTestData()
})

test.afterAll(async () => {
  if (seedIds) await cleanupTestData(seedIds)
})

test.describe('RequestDetailPopup 2단 레이아웃 (3:7, 세션 #47)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/request')
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10000 })
    await page.waitForTimeout(2000)
    await page.locator('text=촬영 일정 조율').first().click()
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
  })

  test('시나리오 1: 데스크톱 — popup-split flex-direction row + 좌우 3:7 비율', async ({ page }) => {
    const split = page.locator('[data-testid="popup-split"]')
    await expect(split).toBeVisible()
    const dir = await split.evaluate((el) => window.getComputedStyle(el).flexDirection)
    expect(dir).toBe('row')

    const left = page.locator('[data-testid="popup-left"]')
    const right = page.locator('[data-testid="popup-right"]')
    const lBox = await left.boundingBox()
    const rBox = await right.boundingBox()
    expect(lBox).not.toBeNull()
    expect(rBox).not.toBeNull()

    // 좌측/우측 너비 비율 ≈ 3/7 (오차 ±5%)
    const ratio = lBox!.width / rBox!.width
    expect(ratio).toBeGreaterThan(0.38)
    expect(ratio).toBeLessThan(0.48)
  })

  test('시나리오 2: 데스크톱 — Dialog.Content maxWidth 860 근처', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]')
    const box = await dialog.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(800)
    expect(box!.width).toBeLessThanOrEqual(860)
  })

  test('시나리오 3: 모바일 375px — popup-split flex-direction column 세로 스택', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(300)
    const split = page.locator('[data-testid="popup-split"]')
    const dir = await split.evaluate((el) => window.getComputedStyle(el).flexDirection)
    expect(dir).toBe('column')
  })
})
