import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAs } from '../utils/auth'
import { ensureRegularTestUser, REGULAR_TEST_EMAIL, REGULAR_TEST_PASSWORD } from '../utils/testUsers'

test.describe('H-1 재조정: 공통 Header 렌더 검증 (세션 #46)', () => {
  test.describe('admin 계정', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page)
    })

    test('시나리오 1: 홈(/) — 관리자 모드 + 로그아웃 버튼 모두 렌더', async ({ page }) => {
      await page.goto('/')
      const header = page.locator('header').first()
      await expect(header).toBeVisible()
      await expect(header.getByRole('button', { name: /관리자 모드/ })).toBeVisible()
      await expect(header.getByRole('button', { name: '로그아웃' })).toBeVisible()
      await expect(header.getByText('Hizzi is happy, and you?')).toBeVisible()
    })

    test('시나리오 2: /mydesk/today — 관리자 모드 미렌더, 로그아웃만 렌더', async ({ page }) => {
      await page.goto('/mydesk/today')
      const header = page.locator('header').first()
      await expect(header).toBeVisible()
      await expect(header.getByRole('button', { name: /관리자 모드/ })).toHaveCount(0)
      await expect(header.getByRole('button', { name: '로그아웃' })).toBeVisible()
    })

    test('시나리오 4: 로그아웃 클릭 → /login 리다이렉트', async ({ page }) => {
      await page.goto('/')
      const header = page.locator('header').first()
      await header.getByRole('button', { name: '로그아웃' }).click()
      await page.waitForURL(/\/login/, { timeout: 15000 })
      expect(page.url()).toContain('/login')
    })

    test('시나리오 6: sticky 배경 #FDF8F4 불투명 — 스크롤 콘텐츠 차단', async ({ page }) => {
      await page.goto('/')
      const header = page.locator('header').first()
      await expect(header).toBeVisible()
      const bg = await header.evaluate((el) => window.getComputedStyle(el).backgroundColor)
      expect(bg).toBe('rgb(253, 248, 244)')
    })

    test('시나리오 5: 모바일 375px 폭에서 Header 한 줄 수용', async ({ page }) => {
      await page.goto('/')
      await page.setViewportSize({ width: 375, height: 667 })
      const header = page.locator('header').first()
      await expect(header).toBeVisible()
      await expect(header.getByText('Hizzi is happy, and you?')).toBeVisible()
      await expect(header.getByRole('button', { name: '로그아웃' })).toBeVisible()
      const box = await header.boundingBox()
      expect(box).not.toBeNull()
      // 설계값 min-height 72px. 두 줄로 깨지면 100px 초과
      expect(box!.height).toBeLessThanOrEqual(100)
    })
  })

  test.describe('일반 계정', () => {
    test.beforeAll(async () => {
      await ensureRegularTestUser()
    })

    test('시나리오 3: 홈(/) — 관리자 모드 버튼 미렌더, 로그아웃만 렌더', async ({ page }) => {
      await loginAs(page, REGULAR_TEST_EMAIL, REGULAR_TEST_PASSWORD)
      await page.goto('/')
      const header = page.locator('header').first()
      await expect(header).toBeVisible()
      await expect(header.getByRole('button', { name: /관리자 모드/ })).toHaveCount(0)
      await expect(header.getByRole('button', { name: '로그아웃' })).toBeVisible()
    })
  })
})
