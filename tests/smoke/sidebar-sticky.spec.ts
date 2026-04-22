import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../utils/auth'

test.describe('Phase H-3: Sidebar 전체 고정 검증 (세션 #47)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('시나리오 1: 홈 진입 — Sidebar sticky top:0 height:100vh', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('[data-testid="sidebar"]')
    await expect(sidebar).toBeVisible()
    const cs = await sidebar.evaluate((el) => {
      const s = window.getComputedStyle(el)
      return { position: s.position, top: s.top, overflowY: s.overflowY }
    })
    expect(cs.position).toBe('sticky')
    expect(cs.top).toBe('0px')
    expect(cs.overflowY).toBe('auto')
    const box = await sidebar.boundingBox()
    expect(box).not.toBeNull()
    // height: 100vh — 뷰포트 높이와 근사치 (기본 viewport 720 근처)
    expect(box!.height).toBeGreaterThanOrEqual(600)
  })

  test('시나리오 2: 본문 스크롤 후 Sidebar 여전히 viewport 상단 고정', async ({ page }) => {
    await page.goto('/')
    // 본문 스크롤 유도 — AppShell 오른쪽 콘텐츠 영역에 큰 높이 주입
    await page.evaluate(() => {
      const main = document.querySelector('main')
      if (main instanceof HTMLElement) {
        main.style.minHeight = '3000px'
      }
    })
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(300)

    const sidebar = page.locator('[data-testid="sidebar"]')
    const box = await sidebar.boundingBox()
    expect(box).not.toBeNull()
    // Sidebar y는 viewport top:0 근처 고정
    expect(box!.y).toBeLessThanOrEqual(1)
  })

  test('시나리오 3: "기타" 섹션 Sidebar 하단 부착 (P-2: 아바타 제거 후 2분할)', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('[data-testid="sidebar"]')
    const misc = page.locator('[data-testid="sidebar-misc"]')
    const menu = page.locator('nav').first() // 주요 메뉴 nav

    const sidebarBox = await sidebar.boundingBox()
    const miscBox = await misc.boundingBox()
    const menuBox = await menu.boundingBox()
    expect(sidebarBox).not.toBeNull()
    expect(miscBox).not.toBeNull()
    expect(menuBox).not.toBeNull()

    // 주요 메뉴(위) → 빈 공간(flex-grow) → 기타(하단 mt-auto 부착)
    expect(miscBox!.y).toBeGreaterThan(menuBox!.y + menuBox!.height)
    // 기타 섹션 끝이 Sidebar 하단 근처 (차이 100px 이내, P-2에서 mb-4 유지)
    const miscBottom = miscBox!.y + miscBox!.height
    const sidebarBottom = sidebarBox!.y + sidebarBox!.height
    expect(sidebarBottom - miscBottom).toBeLessThanOrEqual(100)
  })
})
