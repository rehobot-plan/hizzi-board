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

test.describe('Phase R-2: 사이드바 요청 메뉴 제거 + MY DESK 3뱃지 (세션 #47)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/')
    await page.locator('[data-testid="sidebar"]').waitFor({ state: 'visible' })
    await page.waitForTimeout(1500)
  })

  test('시나리오 1: 사이드바에 "요청" 메뉴 없음', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]')
    // 주요 메뉴 nav 내부 버튼 텍스트 검사
    const requestButton = sidebar.locator('button', { hasText: /^요청$/ })
    await expect(requestButton).toHaveCount(0)
  })

  test('시나리오 2: /request URL 직접 접근 — RequestView 여전히 정상 (R-1 회귀 방지)', async ({ page }) => {
    await page.goto('/request')
    await expect(page.getByRole('heading', { name: '요청 관리' })).toBeVisible()
  })

  test('시나리오 3: MY DESK 버튼에 3뱃지 — seed 기준 받은 1 + 보낸 1', async ({ page }) => {
    // admin 기준 seed 데이터: 요청1(to=admin, pending) + 요청2(from=admin, accepted)
    // → 받은 1, 보낸 1, 진행 0
    const sidebar = page.locator('[data-testid="sidebar"]')
    const receivedBadge = sidebar.locator('[data-testid="badge-received"]')
    const sentBadge = sidebar.locator('[data-testid="badge-sent"]')
    const progressBadge = sidebar.locator('[data-testid="badge-progress"]')

    await expect(receivedBadge).toBeVisible()
    await expect(sentBadge).toBeVisible()
    await expect(progressBadge).toHaveCount(0)

    // 카운트 >= 1 (seed는 최소 1건씩 보장하지만 기존 데이터 섞여 더 클 수 있음)
    const r = parseInt((await receivedBadge.textContent()) || '0', 10)
    const s = parseInt((await sentBadge.textContent()) || '0', 10)
    expect(r).toBeGreaterThanOrEqual(1)
    expect(s).toBeGreaterThanOrEqual(1)
  })

  test('시나리오 4: MY DESK 뱃지 색상 토큰 준수 — 받은 #993556 / 보낸 #C17B6B', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]')
    const receivedBadge = sidebar.locator('[data-testid="badge-received"]')
    const sentBadge = sidebar.locator('[data-testid="badge-sent"]')

    const receivedBg = await receivedBadge.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    const sentBg = await sentBadge.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    expect(receivedBg).toBe('rgb(153, 53, 86)')
    expect(sentBg).toBe('rgb(193, 123, 107)')
  })
})
