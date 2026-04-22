import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../utils/auth'

test.describe('Phase P-2: 프로필 UI 통합 (세션 #47)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/')
    await page.locator('[data-testid="sidebar"]').waitFor({ state: 'visible' })
    await page.waitForTimeout(1000)
  })

  test('시나리오 1: Header 우측 프로필 진입점 — 아바타 + 이름 렌더', async ({ page }) => {
    const trigger = page.locator('[data-testid="header-profile-trigger"]')
    await expect(trigger).toBeVisible()
    // 아바타 + 이름 구성 확인
    await expect(trigger.locator('[data-testid="avatar"]')).toBeVisible()
  })

  test('시나리오 2: 기본 아바타 렌더 — photoURL 빈 값 → data-empty="true"', async ({ page }) => {
    const trigger = page.locator('[data-testid="header-profile-trigger"]')
    const avatar = trigger.locator('[data-testid="avatar"]')
    // admin 계정은 P-1 migration 후 photoURL=""
    await expect(avatar).toHaveAttribute('data-empty', 'true')
  })

  test('시나리오 3: 진입점 클릭 → 프로필 모달 오픈', async ({ page }) => {
    await page.locator('[data-testid="header-profile-trigger"]').click()
    await expect(page.locator('[data-testid="profile-modal"]')).toBeVisible()
  })

  test('시나리오 4: 모달 ESC로 닫힘', async ({ page }) => {
    await page.locator('[data-testid="header-profile-trigger"]').click()
    await expect(page.locator('[data-testid="profile-modal"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="profile-modal"]')).toHaveCount(0)
  })

  test('시나리오 5: Sidebar 하단 아바타 영역 제거됨', async ({ page }) => {
    await expect(page.locator('[data-testid="sidebar-avatar"]')).toHaveCount(0)
  })

  test('시나리오 6: Sidebar 기타 섹션 여전히 mt-auto 하단 부착 (H-3 회귀 방지)', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]')
    const misc = sidebar.locator('[data-testid="sidebar-misc"]')
    const sidebarBox = await sidebar.boundingBox()
    const miscBox = await misc.boundingBox()
    expect(sidebarBox).not.toBeNull()
    expect(miscBox).not.toBeNull()
    // 기타 섹션이 Sidebar 하단 근처 (Sidebar top+height에서 200px 이내)
    const miscBottom = miscBox!.y + miscBox!.height
    const sidebarBottom = sidebarBox!.y + sidebarBox!.height
    expect(sidebarBottom - miscBottom).toBeLessThanOrEqual(200)
  })
})
