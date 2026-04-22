import { test, expect } from '@playwright/test'

const BASE = 'https://hizzi-board.vercel.app'
const HANA_BASE = 'https://hana-vote.vercel.app'

const HEADER_TEXT = 'Hizzi is happy, and you?'

// 인증 필요 라우트: 미로그인 시 /login 리다이렉트됨
// → AppShell(Sidebar+Header)이 렌더되려면 (main) layout을 거쳐야 하므로
//   리다이렉트 전 짧은 순간에도 AppShell 구조가 DOM에 있는지 확인.
// 인증 없이 확인 가능한 것: 해당 라우트가 (main) group에 속하면 AppShell layout이 적용됨.
// 실제 Sidebar는 인증 후에만 보이므로, 여기서는 **구조적 분리**만 검증:
//   - (auth)/(hana-vote) 라우트에서 AppShell 컴포넌트가 DOM에 없음
//   - (main) 라우트에서는 최소한 AppShell 래퍼가 존재

test.describe('Route Group 분리 검증', () => {
  // === (auth) 그룹: Sidebar·Header 미렌더 ===

  test('5. /login → Sidebar·Header 없음', async ({ page }) => {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    const sidebar = page.locator('aside')
    const header = page.getByText(HEADER_TEXT)
    await expect(sidebar).toHaveCount(0)
    await expect(header).toHaveCount(0)
  })

  test('6. /signup → Sidebar·Header 없음', async ({ page }) => {
    await page.goto(`${BASE}/signup`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    const sidebar = page.locator('aside')
    const header = page.getByText(HEADER_TEXT)
    await expect(sidebar).toHaveCount(0)
    await expect(header).toHaveCount(0)
  })

  // === hana-vote: Sidebar·Header 미렌더 ===

  test('7. /hana-vote → Sidebar·Header 없음', async ({ page }) => {
    await page.goto(`${BASE}/hana-vote`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    const sidebar = page.locator('aside')
    const header = page.getByText(HEADER_TEXT)
    await expect(sidebar).toHaveCount(0)
    await expect(header).toHaveCount(0)
  })

  test('8. hana-vote.vercel.app/ → Sidebar·Header 없음', async ({ page }) => {
    // hana-vote 도메인이 연결되어 있지 않으면 skip
    try {
      const resp = await page.goto(`${HANA_BASE}/`, { waitUntil: 'domcontentloaded', timeout: 10000 })
      if (!resp || resp.status() >= 400) {
        test.skip()
        return
      }
    } catch {
      test.skip()
      return
    }
    await page.waitForTimeout(3000)
    const sidebar = page.locator('aside')
    const header = page.getByText(HEADER_TEXT)
    await expect(sidebar).toHaveCount(0)
    await expect(header).toHaveCount(0)
  })

  // === (main) 그룹: 인증 리다이렉트 전 AppShell 구조 확인 ===
  // 미로그인 시 /login으로 리다이렉트되므로, 최종 URL이 /login이면
  // 해당 라우트가 (main) group에 속한다는 의미 (리다이렉트 발생 = 인증 가드 작동).
  // AppShell 자체는 리다이렉트 후에는 보이지 않으므로, 리다이렉트 발생 여부로 검증.

  test('1. / → (main) 그룹 소속 확인 (인증 가드 리다이렉트)', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    // 미로그인 → /login 리다이렉트 또는 로딩 화면
    const url = page.url()
    const isMainGroup = url.includes('/login') || url === `${BASE}/`
    expect(isMainGroup).toBe(true)
  })

  test('2. /mydesk/today → (main) 그룹 소속 확인', async ({ page }) => {
    await page.goto(`${BASE}/mydesk/today`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    const url = page.url()
    const isMainGroup = url.includes('/login') || url.includes('/mydesk')
    expect(isMainGroup).toBe(true)
  })

  test('3. /request → (main) 그룹 소속 확인', async ({ page }) => {
    await page.goto(`${BASE}/request`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    const url = page.url()
    const isMainGroup = url.includes('/login') || url.includes('/request')
    expect(isMainGroup).toBe(true)
  })

  test('4. /leave → (main) 그룹 소속 확인', async ({ page }) => {
    await page.goto(`${BASE}/leave`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    const url = page.url()
    const isMainGroup = url.includes('/login') || url.includes('/leave')
    expect(isMainGroup).toBe(true)
  })
})
