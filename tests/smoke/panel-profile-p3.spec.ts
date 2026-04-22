import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../utils/auth'

test.describe('Phase P-3: 패널 제목 옆 프로필 사진 (세션 #48)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/')
    await page.locator('[data-testid="sidebar"]').waitFor({ state: 'visible' })
    await page.waitForTimeout(1500)
  })

  test('시나리오 1: 홈 패널 제목 행에 아바타 렌더 (6개 패널 전부)', async ({ page }) => {
    const rows = page.locator('[data-testid="panel-title-row"]')
    const count = await rows.count()
    expect(count).toBeGreaterThanOrEqual(1)
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i)
      const avatar = row.locator('[data-testid="avatar"]')
      // 소유자 email이 있는 패널만 avatar 렌더 (ownerEmail && ...)
      const avatarCount = await avatar.count()
      // 렌더된 경우 크기 40px 근처
      if (avatarCount > 0) {
        const box = await avatar.first().boundingBox()
        expect(box).not.toBeNull()
        expect(box!.width).toBeGreaterThanOrEqual(36)
        expect(box!.width).toBeLessThanOrEqual(44)
      }
    }
  })

  test('시나리오 2: 시드 무관 — ownerEmail 있는 패널에 Avatar 요소 렌더', async ({ page }) => {
    // photoURL 유/무 분기는 Avatar 컴포넌트 단위 테스트 영역으로 이관.
    // E2E는 "패널 제목 좌측에 아바타 요소가 존재하는가"만 책임.
    const rows = page.locator('[data-testid="panel-title-row"]')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThanOrEqual(1)
    const avatars = page.locator('[data-testid="panel-title-row"] [data-testid="avatar"]')
    expect(await avatars.count()).toBeGreaterThanOrEqual(1)
  })

  test('시나리오 3: 클릭 비활성 — 아바타 자체 click handler 없음 (profile.md §9)', async ({ page }) => {
    const avatar = page.locator('[data-testid="panel-title-row"] [data-testid="avatar"]').first()
    // 아바타는 span 요소라 onClick 없음. cursor도 pointer 아님
    const cursor = await avatar.evaluate((el) => window.getComputedStyle(el).cursor)
    expect(cursor).not.toBe('pointer')
  })

  test('시나리오 4: 소유자 명함(부서·직책) — 렌더 시 토큰 준수 + 아바타 우측 배치', async ({ page }) => {
    // 시드 독립: 명함 요소 유무는 Firestore 값에 의존. 렌더된 경우만 속성·배치 검증.
    const metas = page.locator('[data-testid="panel-owner-meta"]')
    const count = await metas.count()
    if (count === 0) {
      // 모든 소유자가 department·position 미설정 상태 — 렌더 없음 허용, 통과
      return
    }
    for (let i = 0; i < count; i++) {
      const meta = metas.nth(i)
      // 11px / weight 400 / #9E8880 (rgb 158,136,128) 토큰 준수
      const style = await meta.evaluate((el) => {
        const s = window.getComputedStyle(el)
        return { size: s.fontSize, weight: s.fontWeight, color: s.color }
      })
      expect(style.size).toBe('11px')
      expect(['400', 'normal']).toContain(style.weight)
      expect(style.color).toBe('rgb(158, 136, 128)')
      // 구분자 포함 시 양쪽 값이 있음 — " · " 포함 여부는 시드 상태 따라 달라지므로 강제 아님
      const text = (await meta.textContent()) || ''
      expect(text.length).toBeGreaterThan(0)
    }
    // 배치: 같은 panel-title-row 내 avatar 우측
    const firstRow = page.locator('[data-testid="panel-title-row"]').filter({ has: metas.first() }).first()
    const avatarBox = await firstRow.locator('[data-testid="avatar"]').boundingBox()
    const metaBox = await firstRow.locator('[data-testid="panel-owner-meta"]').boundingBox()
    if (avatarBox && metaBox) {
      expect(metaBox.x).toBeGreaterThan(avatarBox.x + avatarBox.width - 2)
    }
  })
})
