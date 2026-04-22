'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminVoteStore } from '@/store/adminVoteStore'
import { calculateCandidateResults, calculatePartStats, getPartTotal } from '@/lib/voteCalculator'
import type { CandidateResult, PartStats } from '@/lib/voteCalculator'
import type { VotePart } from '@/types/vote'

const ADMIN_SESSION_KEY = 'hanaVoteAdmin'

export default function ReportPage() {
  const [authed, setAuthed] = useState(false)
  const [checkedAuth, setCheckedAuth] = useState(false)
  const {
    session, candidates, ballots,
    initListeners, cleanupListeners,
  } = useAdminVoteStore()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ok = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'yes'
    setAuthed(ok)
    setCheckedAuth(true)
  }, [])

  useEffect(() => {
    if (!authed) return
    initListeners()
    return () => cleanupListeners()
  }, [authed, initListeners, cleanupListeners])

  if (!checkedAuth) {
    return <div style={{ padding: 40, color: '#6e6e6e', fontSize: 13 }}>확인 중...</div>
  }

  if (!authed) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: '#3c3c3c', marginBottom: 14 }}>관리자 인증이 필요합니다.</div>
        <Link href='/hana-vote/admin' style={{ padding: '8px 16px', background: '#1c1c1c', color: '#fff', textDecoration: 'none', borderRadius: 4, fontSize: 13 }}>
          관리자 로그인으로 이동
        </Link>
      </div>
    )
  }

  if (!session) {
    return <div style={{ padding: 40, color: '#6e6e6e', fontSize: 13 }}>세션 정보 로딩 중...</div>
  }

  const finalizedAt = (() => {
    const ts = session.finalizedAt as { toDate?: () => Date } | null | undefined
    if (ts && typeof ts.toDate === 'function') {
      return ts.toDate().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    }
    return null
  })()

  const parts: VotePart[] = ['장로', '시무권사', '안수집사']
  const resultsByPart: Record<VotePart, CandidateResult[]> = {
    '장로': calculateCandidateResults(candidates, ballots, getPartTotal(session, '장로'), '장로'),
    '시무권사': calculateCandidateResults(candidates, ballots, getPartTotal(session, '시무권사'), '시무권사'),
    '안수집사': calculateCandidateResults(candidates, ballots, getPartTotal(session, '안수집사'), '안수집사'),
  }
  const statsByPart: Record<VotePart, PartStats> = {
    '장로': calculatePartStats(ballots, candidates, '장로', getPartTotal(session, '장로')),
    '시무권사': calculatePartStats(ballots, candidates, '시무권사', getPartTotal(session, '시무권사')),
    '안수집사': calculatePartStats(ballots, candidates, '안수집사', getPartTotal(session, '안수집사')),
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .report-container { max-width: none !important; padding: 0 !important; }
          .part-section { page-break-inside: avoid; }
          .part-section + .part-section { page-break-before: always; }
        }
      `}</style>

      <div className='no-print' style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href='/hana-vote/admin' style={{ fontSize: 13, color: '#6e6e6e', textDecoration: 'none' }}>← 대시보드</Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{ padding: '8px 16px', background: '#1c1c1c', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >인쇄</button>
        </div>
      </div>

      <div className='report-container' style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', fontFamily: 'Noto Sans KR, -apple-system, sans-serif', color: '#1c1c1c' }}>

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginBottom: 4 }}>중직자 선거 개표 결과</h1>
          <div style={{ fontSize: 13, color: '#6e6e6e' }}>{session.sessionName}</div>
        </div>

        <div style={{ borderTop: '2px solid #1c1c1c', borderBottom: '2px solid #1c1c1c', padding: '14px 0', marginTop: 24, marginBottom: 20, fontSize: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <div>
              <div style={{ color: '#6e6e6e', fontSize: 11, marginBottom: 3 }}>세션명</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{session.sessionName}</div>
            </div>
            <div>
              <div style={{ color: '#6e6e6e', fontSize: 11, marginBottom: 3 }}>집계 완료 시각</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{finalizedAt || '마감 전'}</div>
            </div>
          </div>
        </div>

        <div className='part-summary' style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {parts.map((p) => (
            <PartSummaryBox key={p} stats={statsByPart[p]} />
          ))}
        </div>

        {!session.isFinalized && (
          <div className='no-print' style={{ marginBottom: 20, padding: '10px 14px', background: '#fef0f3', color: '#993556', fontSize: 13, borderRadius: 4 }}>
            아직 투표가 마감되지 않았습니다. 최종 보고서는 마감 후 출력하세요.
          </div>
        )}

        {parts.map((part) => (
          <PartSection
            key={part}
            part={part}
            results={resultsByPart[part]}
            stats={statsByPart[part]}
          />
        ))}

        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px dashed #c8c8c8', fontSize: 11, color: '#6e6e6e', textAlign: 'center' }}>
          당선 기준: 파트별 배포 투표지 수 × 2/3 이상 찬성 (올림)
        </div>
      </div>
    </>
  )
}

interface PartSectionProps {
  part: VotePart
  results: CandidateResult[]
  stats: PartStats
}

function PartSummaryBox({ stats }: { stats: PartStats }) {
  const rowLabel = { color: '#6e6e6e', fontSize: 11 } as const
  const rowValue = { fontWeight: 700, fontSize: 13, color: '#1c1c1c' } as const
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 0' } as const
  return (
    <div style={{ border: '1px solid #c8c8c8', borderRadius: 4, padding: '12px 14px', background: '#fff' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1c1c1c', paddingBottom: 8, marginBottom: 6, borderBottom: '1px solid #e0e0e0' }}>{stats.part}</div>
      <div style={row}><span style={rowLabel}>전체 투표수</span><span style={rowValue}>{stats.totalParticipants}장</span></div>
      <div style={row}><span style={rowLabel}>당선 기준</span><span style={rowValue}>{stats.threshold}표</span></div>
      <div style={row}><span style={rowLabel}>유효</span><span style={rowValue}>{stats.validCount}</span></div>
      <div style={row}><span style={rowLabel}>무효</span><span style={rowValue}>{stats.invalidCount}</span></div>
      <div style={row}><span style={rowLabel}>회수 안 됨</span><span style={rowValue}>{stats.missingCount}</span></div>
      <div style={{ height: 0, borderTop: '1px dashed #c8c8c8', margin: '8px 0' }} />
      <div style={row}><span style={rowLabel}>후보 수</span><span style={rowValue}>{stats.candidateCount}명</span></div>
      <div style={row}><span style={rowLabel}>당선</span><span style={{ ...rowValue, fontWeight: 700 }}>{stats.electedCount}명</span></div>
      <div style={row}><span style={rowLabel}>탈락</span><span style={rowValue}>{stats.rejectedCount}명</span></div>
    </div>
  )
}

function PartSection({ part, results, stats }: PartSectionProps) {
  return (
    <section className='part-section' style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid #1c1c1c', paddingBottom: 8, marginBottom: 14 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>{part}</h2>
        <div style={{ fontSize: 12, color: '#6e6e6e' }}>개표 {stats.validCount + stats.invalidCount}장</div>
      </div>

      {results.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#6e6e6e', fontSize: 13 }}>후보 없음</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, fontSize: 12, color: '#3c3c3c', width: 50 }}>순위</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, fontSize: 12, color: '#3c3c3c' }}>이름</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 12, color: '#3c3c3c', width: 70 }}>찬성</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 12, color: '#3c3c3c', width: 70 }}>반대</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 12, color: '#3c3c3c', width: 70 }}>무효</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 12, color: '#3c3c3c', width: 80 }}>득표율</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, fontSize: 12, color: '#3c3c3c', width: 70 }}>판정</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => (
              <tr key={r.candidateId} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '10px 12px', color: '#6e6e6e' }}>{idx + 1}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: r.isBlue ? '#2563EB' : '#1c1c1c' }}>{r.name}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{r.yes}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#3c3c3c' }}>{r.no}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#3c3c3c' }}>{r.invalid}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#3c3c3c' }}>{r.yesRate.toFixed(1)}%</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', fontSize: 11, fontWeight: 700, borderRadius: 3,
                    background: r.isElected ? '#1c1c1c' : 'transparent',
                    color: r.isElected ? '#fff' : '#6e6e6e',
                    border: r.isElected ? 'none' : '1px solid #c8c8c8',
                  }}>
                    {r.isElected ? '당선' : '미달'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
