import { describe, test, expect } from 'vitest'
import { computeBadges, type RequestForBadges } from '@/lib/sidebarBadges'

function r(partial: RequestForBadges): RequestForBadges {
  return partial
}

const ME = 'me@x.com'
const OTHER = 'other@x.com'

describe('computeBadges — Sidebar 3뱃지 + 오늘 탭 요청 카드 공유 계산', () => {
  test('receivedPending: toEmail=me + status=pending 건수', () => {
    const reqs = [
      r({ toEmail: ME, status: 'pending' }),
      r({ toEmail: ME, status: 'pending' }),
      r({ toEmail: ME, status: 'accepted' }),      // 제외 — accepted
      r({ toEmail: OTHER, status: 'pending' }),    // 제외 — 타인 수신
      r({ fromEmail: ME, status: 'pending' }),     // 제외 — 내가 발신
    ]
    expect(computeBadges(reqs, ME).receivedPending).toBe(2)
  })

  test('sentPending: fromEmail=me + status=pending (accepted 제외)', () => {
    const reqs = [
      r({ fromEmail: ME, status: 'pending' }),
      r({ fromEmail: ME, status: 'pending' }),
      r({ fromEmail: ME, status: 'pending' }),
      r({ fromEmail: ME, status: 'accepted' }),     // 제외 — accepted는 sentPending 아님
      r({ fromEmail: ME, status: 'completed' }),    // 제외
      r({ fromEmail: OTHER, status: 'pending' }),   // 제외 — 타인 발신
    ]
    expect(computeBadges(reqs, ME).sentPending).toBe(3)
  })

  test('inProgress: toEmail=me + status=accepted 건수', () => {
    const reqs = [
      r({ toEmail: ME, status: 'accepted' }),
      r({ toEmail: ME, status: 'pending' }),        // 제외 — pending
      r({ toEmail: ME, status: 'completed' }),      // 제외 — completed
      r({ toEmail: OTHER, status: 'accepted' }),    // 제외 — 타인 수신
      r({ fromEmail: ME, status: 'accepted' }),     // 제외 — 내가 발신
    ]
    expect(computeBadges(reqs, ME).inProgress).toBe(1)
  })

  test('빈 배열 → 전부 0', () => {
    expect(computeBadges([], ME)).toEqual({
      receivedPending: 0,
      sentPending: 0,
      inProgress: 0,
    })
  })

  test('email 빈 문자열 → 0 (매칭되는 문서 없음)', () => {
    const reqs = [r({ toEmail: ME, status: 'pending' })]
    expect(computeBadges(reqs, '')).toEqual({
      receivedPending: 0,
      sentPending: 0,
      inProgress: 0,
    })
  })
})
