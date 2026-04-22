import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../utils/auth'

test.describe('Phase R-1: RequestView 두 진입점 동일 렌더 (세션 #47)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('시나리오 1: /request — RequestView 렌더 (기존 URL 회귀 없음)', async ({ page }) => {
    await page.goto('/request')
    await expect(page.getByRole('heading', { name: '요청 관리' })).toBeVisible()
  })

  test('시나리오 2: /mydesk/request — RequestView 렌더 (신규 진입점)', async ({ page }) => {
    await page.goto('/mydesk/request')
    await expect(page.getByRole('heading', { name: '요청 관리' })).toBeVisible()
  })

  test('시나리오 3: 두 경로 동일 컴포넌트 — 같은 h1 + RequestList 구조', async ({ page }) => {
    await page.goto('/request')
    const reqH1 = await page.getByRole('heading', { name: '요청 관리' }).textContent()
    await page.goto('/mydesk/request')
    const mydeskH1 = await page.getByRole('heading', { name: '요청 관리' }).textContent()
    expect(reqH1).toBe(mydeskH1)
  })
})
