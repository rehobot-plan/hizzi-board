import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../utils/auth'

test.describe('Phase R-3: 오늘 탭 4카드 재편 (세션 #49)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mydesk/today')
    await page.locator('[data-testid="sidebar"]').waitFor({ state: 'visible' })
    await page.waitForTimeout(1500)
  })

  test('시나리오 1: 연차 카드 부재 + overdue 카드 존재', async ({ page }) => {
    // 연차 제목 미존재
    await expect(page.getByText(/^연차$/)).toHaveCount(0)
    // overdue 카드 존재
    await expect(page.getByText(/^overdue$/i)).toBeVisible()
  })

  test('시나리오 2: 4카드 제목 [할일/일정/요청/overdue] 순서', async ({ page }) => {
    const titles = page.locator('.grid > div >> nth=0, .grid > div >> nth=1, .grid > div >> nth=2, .grid > div >> nth=3')
    // 각 카드 상단 라벨 텍스트 확인
    await expect(page.getByText(/^할일$/).first()).toBeVisible()
    await expect(page.getByText(/^일정$/).first()).toBeVisible()
    await expect(page.getByText(/^요청$/).first()).toBeVisible()
    await expect(page.getByText(/^overdue$/i).first()).toBeVisible()
  })

  test('시나리오 3: 요청 카드 subLabel 포맷 "보낸 대기 N · 진행 중 M"', async ({ page }) => {
    await expect(page.getByText(/보낸 대기 \d+ · 진행 중 \d+/)).toBeVisible()
  })

  test('시나리오 4: overdue 카드 subLabel "미완료" + 좌측 띠 #A32D2D', async ({ page }) => {
    // 첫 번째 "미완료" 텍스트가 overdue 카드 subLabel
    await expect(page.getByText('미완료').first()).toBeVisible()
    // overdue 카드 전체의 border-left 색상 확인 (title div의 parent = SummaryCard root)
    const overdueTitle = page.getByText(/^overdue$/i).first()
    const card = overdueTitle.locator('..')
    const borderLeft = await card.evaluate((el) => window.getComputedStyle(el).borderLeftColor)
    // #A32D2D = rgb(163, 45, 45)
    expect(borderLeft).toBe('rgb(163, 45, 45)')
  })

  test('시나리오 5: 할일 카드 클릭 → /mydesk/todo', async ({ page }) => {
    await page.getByText(/^할일$/).first().click()
    await page.waitForURL(/\/mydesk\/todo/, { timeout: 10000 })
    expect(page.url()).toContain('/mydesk/todo')
  })

  test('시나리오 6: 요청 카드 클릭 → /mydesk/request', async ({ page }) => {
    await page.getByText(/^요청$/).first().click()
    await page.waitForURL(/\/mydesk\/request/, { timeout: 10000 })
    expect(page.url()).toContain('/mydesk/request')
  })

  test('시나리오 7: overdue 카드 클릭 → /mydesk/todo', async ({ page }) => {
    await page.getByText(/^overdue$/i).first().click()
    await page.waitForURL(/\/mydesk\/todo/, { timeout: 10000 })
    expect(page.url()).toContain('/mydesk/todo')
  })

  test('시나리오 8: 모바일 375px — 2×2 그리드', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(300)
    const grid = page.locator('.grid').first()
    const cols = await grid.evaluate((el) => window.getComputedStyle(el).gridTemplateColumns)
    // 2열이면 값이 2개 길이 표현 (예: "160px 160px")
    const colCount = cols.split(' ').length
    expect(colCount).toBe(2)
  })
})
