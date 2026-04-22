/**
 * Hana Vote 오프라인 큐 복구 검증
 *
 * 주의: src/lib/firebase.ts 에서 getFirestore(app) 만 호출하고
 * persistentLocalCache 설정이 없으면, 오프라인 persistence 가 비활성 상태.
 * 이 경우 오프라인 저장은 메모리 큐에만 머물고, 탭 종료 시 유실됨.
 * 이 스크립트는 "탭 유지 상태에서 네트워크 복구 시 동기화" 를 검증.
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { chromium } from 'playwright'

const serviceAccountPath = 'D:\\Dropbox\\Dropbox\\serviceAccount.json'
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))
initializeApp({ credential: cert(serviceAccount), projectId: 'hizzi-board' })
const db = getFirestore()

const MARKER = 'OFFLINE_TEST'
const BASE_URL = 'https://hizzi-board.vercel.app/hana-vote'
const PASSWORD = 'hana2026'

interface TestResult { step: string; status: 'PASS' | 'FAIL' | 'SKIP'; detail: string }
const results: TestResult[] = []

function report(step: string, status: 'PASS' | 'FAIL' | 'SKIP', detail: string) {
  results.push({ step, status, detail })
  console.log('  [' + status + '] ' + step + (detail ? ' — ' + detail : ''))
}

async function countServerBallots(): Promise<number> {
  const snap = await db.collection('ballots').where('counterName', '==', MARKER).get()
  return snap.size
}

async function cleanupMarker(): Promise<number> {
  const snap = await db.collection('ballots').where('counterName', '==', MARKER).get()
  for (const d of snap.docs) await d.ref.delete()
  return snap.size
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('=== Hana Vote 오프라인 큐 검증 ===')
  console.log('')

  // Step 1: Cleanup
  console.log('[1] 마커 준비')
  const cleaned = await cleanupMarker()
  console.log('  기존 OFFLINE_TEST ballot 삭제: ' + cleaned + '건')

  // Step 2: Launch browser
  console.log('\n[2] 브라우저 실행')
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Navigate and login
    console.log('  접속: ' + BASE_URL)
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await sleep(2000)

    // Click team 1
    const teamBtn = page.locator('button', { hasText: '1조' })
    await teamBtn.click()
    await sleep(300)

    // Click 장로
    const partBtn = page.locator('button', { hasText: '장로' })
    await partBtn.click()
    await sleep(300)

    // Fill password
    const pwInput = page.locator('input[type="password"]')
    await pwInput.fill(PASSWORD)

    // Fill counter name
    const textInputs = page.locator('input[type="text"]')
    const counterInput = textInputs.nth(0)
    await counterInput.fill(MARKER)

    // Fill supervisor name
    const supervisorInput = textInputs.nth(1)
    await supervisorInput.fill('오프라인감독')

    // Click 입장
    const loginBtn = page.locator('button', { hasText: '입장' })
    await loginBtn.click()

    // Wait for ballot page
    await page.waitForURL('**/ballot**', { timeout: 15000 }).catch(() => {})
    await sleep(3000)

    // Check if we're on ballot page
    const url = page.url()
    if (url.includes('ballot')) {
      report('로그인 + ballot 진입', 'PASS', url)
    } else {
      report('로그인 + ballot 진입', 'FAIL', '현재 URL: ' + url)
      throw new Error('로그인 실패')
    }

    // Step 3: Online save — 2 ballots
    console.log('\n[3] 온라인 저장 (2장)')

    for (let i = 0; i < 2; i++) {
      // Click first candidate's 반대 button
      const noBtn = page.locator('button', { hasText: '반대' }).first()
      await noBtn.click()
      await sleep(300)

      // Set dialog handler BEFORE clicking save
      page.once('dialog', dialog => dialog.accept())
      const saveBtn = page.locator('button', { hasText: /저장 후 다음 장/ })
      await saveBtn.click()
      await sleep(2500)
      console.log('  ' + (i + 1) + '장 저장 시도 완료')
    }

    // Wait for Firestore sync
    await sleep(3000)
    const onlineCount = await countServerBallots()
    report('온라인 저장 확인', onlineCount >= 2 ? 'PASS' : 'FAIL', '서버 ballot: ' + onlineCount + '건 (예상: 2)')

    // Step 4: Go offline
    console.log('\n[4] 네트워크 오프라인 전환')
    await context.setOffline(true)
    report('오프라인 전환', 'PASS', 'setOffline(true)')

    // Step 5: Offline save — attempt 3 ballots
    console.log('\n[5] 오프라인 저장 시도 (3장)')
    let offlineSaved = 0
    for (let i = 0; i < 3; i++) {
      // Wait for UI to settle
      await sleep(1000)

      // Check if save button is available
      const saveBtn = page.locator('button', { hasText: /저장 후 다음 장/ })
      const btnText = await saveBtn.textContent({ timeout: 3000 }).catch(() => '')
      if (btnText?.includes('저장 중')) {
        console.log('  ' + (i + 1) + '장: addDoc pending — SDK가 resolve하지 않음')
        break
      }

      const saveDisabled = await saveBtn.isDisabled().catch(() => true)
      if (saveDisabled) {
        // Debug: check why disabled
        const debugInfo = await page.evaluate(() => {
          const ss = sessionStorage.getItem('hanaVoteLogin')
          return { sessionStorage: ss }
        }).catch(() => ({}))
        const candCount = await page.locator('button:has-text("반대")').count().catch(() => -1)
        const opacity = await saveBtn.evaluate(el => getComputedStyle(el).opacity).catch(() => 'unknown')
        const finBanner = await page.locator('text=/투표가 마감되었습니다/').count().catch(() => 0)
        const savingText = await saveBtn.textContent().catch(() => '')
        console.log('  ' + (i + 1) + '장: 저장 버튼 비활성 (cands=' + candCount + ', opacity=' + opacity + ', finBanner=' + finBanner + ', btnText="' + savingText + '")')
        break
      }

      // Click a 반대 button
      const noBtn = page.locator('button', { hasText: '반대' }).first()
      await noBtn.click({ timeout: 3000 }).catch(() => {})
      await sleep(300)

      // Register dialog handler BEFORE clicking save
      page.once('dialog', dialog => dialog.accept())
      await saveBtn.click({ timeout: 5000 }).catch(() => {})

      // Wait for save to complete
      await sleep(3000)

      const postText = await saveBtn.textContent({ timeout: 3000 }).catch(() => '')
      if (postText?.includes('저장 중')) {
        console.log('  ' + (i + 1) + '장: addDoc pending 상태 유지')
        offlineSaved = i
        break
      }
      offlineSaved = i + 1
      console.log('  ' + (i + 1) + '장 오프라인 저장 완료')
    }

    if (offlineSaved === 0) {
      report('오프라인 저장 (SDK 동작)', 'FAIL',
        'addDoc가 오프라인에서 resolve되지 않음.')
    } else if (offlineSaved < 3) {
      report('오프라인 저장 (SDK 동작)', 'FAIL',
        offlineSaved + '/3장만 저장.')
    } else {
      report('오프라인 저장 (SDK 동작)', 'PASS', '3장 모두 낙관적 저장 완료')
    }

    const countText = await page.locator('text=/입력 완료/').textContent().catch(() => '')
    console.log('  UI 표시: ' + (countText || '(못 읽음)'))

    // Step 6: Verify server state (should still be 2, not 5)
    console.log('\n[6] 오프라인 중 서버 상태 확인')
    await sleep(1000)
    const offlineServerCount = await countServerBallots()
    if (offlineServerCount === onlineCount) {
      report('오프라인 중 서버 미반영', 'PASS', '서버 ballot: ' + offlineServerCount + '건 (온라인 때와 동일)')
    } else if (offlineServerCount > onlineCount) {
      report('오프라인 중 서버 미반영', 'FAIL', '서버에 ' + offlineServerCount + '건 — 오프라인인데 서버에 반영됨')
    } else {
      report('오프라인 중 서버 미반영', 'FAIL', '서버 ' + offlineServerCount + '건 — 예상치 못한 상태')
    }

    // Step 7: Go online
    console.log('\n[7] 네트워크 온라인 복구')
    await context.setOffline(false)
    report('온라인 복구', 'PASS', 'setOffline(false)')

    // Wait for queue flush
    console.log('  큐 flush 대기 (8초)...')
    await sleep(8000)

    // Step 8: Verify server sync
    console.log('\n[8] 복구 후 서버 동기화 확인')
    const finalServerCount = await countServerBallots()
    const expectedTotal = onlineCount + 3
    if (finalServerCount >= expectedTotal) {
      report('복구 후 자동 동기화', 'PASS', '서버 ballot: ' + finalServerCount + '건 (예상: >=' + expectedTotal + ')')
    } else {
      report('복구 후 자동 동기화', 'FAIL', '서버 ballot: ' + finalServerCount + '건 (예상: >=' + expectedTotal + ') — persistence 미설정 가능성')
    }

  } catch (e) {
    console.error('테스트 중 오류:', e)
  } finally {
    // Step 9: Cleanup
    console.log('\n[9] 정리')
    await browser.close()
    const finalClean = await cleanupMarker()
    console.log('  OFFLINE_TEST ballot 삭제: ' + finalClean + '건')
    console.log('  브라우저 종료')
  }

  // Summary
  console.log('\n========================================')
  console.log('결과 요약')
  console.log('========================================')
  const maxLen = Math.max(...results.map(r => r.step.length))
  for (const r of results) {
    console.log('  ' + r.step.padEnd(maxLen + 2) + r.status + '  ' + r.detail)
  }

  const passCount = results.filter(r => r.status === 'PASS').length
  const failCount = results.filter(r => r.status === 'FAIL').length
  console.log('\n  ' + passCount + ' PASS / ' + failCount + ' FAIL')

  if (failCount > 0) {
    console.log('\n[참고] "복구 후 자동 동기화" FAIL 시:')
    console.log('  src/lib/firebase.ts 에서 initializeFirestore + persistentLocalCache 설정 필요.')
    console.log('  현재 getFirestore(app) 만 사용 → 메모리 캐시만 활성 → 탭 닫으면 큐 유실.')
  }

  process.exit(failCount === 0 ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
