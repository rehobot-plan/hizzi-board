'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdminVoteStore } from '@/store/adminVoteStore'
import { useEscClose } from '@/hooks/useEscClose'
import { calculateCandidateResults, getWinThreshold, calculateTeamProgress, getPartTotal } from '@/lib/voteCalculator'
import type { VotePart } from '@/types/vote'

const PARTS: VotePart[] = ['장로', '시무권사', '안수집사']

const ADMIN_SESSION_KEY = 'hanaVoteAdmin'
const ADMIN_PW = process.env.NEXT_PUBLIC_VOTE_ADMIN_PW || 'admin2026'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState('')

  const {
    session, candidates, teams, ballots,
    initListeners, cleanupListeners, updateSession, toggleFinalized, resetBallots,
  } = useAdminVoteStore()

  const [selectedPart, setSelectedPart] = useState<VotePart>('장로')

  const [showResetModal, setShowResetModal] = useState(false)
  const [resetPw, setResetPw] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [resetting, setResetting] = useState(false)

  useEscClose(() => {
    if (!resetting) {
      setShowResetModal(false)
      setResetPw('')
      setResetMsg('')
    }
  }, showResetModal)

  const handleReset = async () => {
    if (resetPw !== ADMIN_PW) {
      setResetMsg('비밀번호가 일치하지 않습니다.')
      return
    }
    setResetting(true)
    setResetMsg('')
    try {
      const count = await resetBallots()
      setResetMsg(count + '장 삭제 완료')
      setTimeout(() => {
        setShowResetModal(false)
        setResetPw('')
        setResetMsg('')
      }, 1500)
    } catch (e) {
      console.error(e)
      setResetMsg('삭제 중 오류가 발생했습니다.')
    }
    setResetting(false)
  }

  const [formName, setFormName] = useState('')
  const [formParticipantsByPart, setFormParticipantsByPart] = useState<Record<VotePart, string>>({
    '장로': '',
    '시무권사': '',
    '안수집사': '',
  })
  const [formPassword, setFormPassword] = useState('')
  const [savingSession, setSavingSession] = useState(false)
  const [sessionMsg, setSessionMsg] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === 'yes') setAuthed(true)
  }, [])

  useEffect(() => {
    if (!authed) return
    initListeners()
    return () => cleanupListeners()
  }, [authed, initListeners, cleanupListeners])

  useEffect(() => {
    if (session) {
      setFormName(session.sessionName)
      setFormParticipantsByPart({
        '장로': String(session.totalParticipantsByPart?.['장로'] ?? session.totalParticipants ?? 0),
        '시무권사': String(session.totalParticipantsByPart?.['시무권사'] ?? session.totalParticipants ?? 0),
        '안수집사': String(session.totalParticipantsByPart?.['안수집사'] ?? session.totalParticipants ?? 0),
      })
      setFormPassword(session.accessPassword)
    }
  }, [session])

  const handlePwSubmit = () => {
    if (pwInput === ADMIN_PW) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'yes')
      setAuthed(true)
      setPwError('')
    } else {
      setPwError('비밀번호가 일치하지 않습니다.')
    }
  }

  const handleSaveSession = async () => {
    setSessionMsg('')
    const parsed: Record<VotePart, number> = { '장로': 0, '시무권사': 0, '안수집사': 0 }
    for (const p of PARTS) {
      const n = Number(formParticipantsByPart[p])
      if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) {
        setSessionMsg(p + ' 배포 수를 1 이상 정수로 입력하세요.')
        return
      }
      parsed[p] = n
    }
    if (!formName.trim() || !formPassword.trim()) {
      setSessionMsg('세션명·비밀번호를 입력해주세요.')
      return
    }
    const confirmMsg = '장로 ' + parsed['장로'] + ' / 시무권사 ' + parsed['시무권사'] + ' / 안수집사 ' + parsed['안수집사'] + ' 로 저장. 계속?'
    if (!window.confirm(confirmMsg)) return

    setSavingSession(true)
    try {
      await updateSession({
        sessionName: formName.trim(),
        totalParticipantsByPart: {
          '장로': parsed['장로'],
          '시무권사': parsed['시무권사'],
          '안수집사': parsed['안수집사'],
        },
        accessPassword: formPassword.trim(),
      })
      setSessionMsg('저장됨')
      setTimeout(() => setSessionMsg(''), 2000)
    } catch (e) {
      console.error(e)
      setSessionMsg('저장 실패')
    }
    setSavingSession(false)
  }

  const handleToggleFinalize = async () => {
    if (!session) return
    const msg = session.isFinalized
      ? '투표 마감을 해제하시겠습니까? 개표자들이 다시 입력할 수 있습니다.'
      : '투표를 마감하시겠습니까? 개표자들이 더 이상 입력할 수 없습니다.'
    if (!window.confirm(msg)) return
    try {
      await toggleFinalized()
    } catch (e) {
      console.error(e)
      alert('마감 상태 변경 실패')
    }
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 360, background: '#fff', padding: '40px 32px', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#1c1c1c' }}>관리자 인증</h1>
          <p style={{ fontSize: 13, color: '#6e6e6e', marginBottom: 28 }}>관리자 비밀번호를 입력하세요</p>
          <input
            type='password' placeholder='관리자 비밀번호' value={pwInput} autoFocus
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handlePwSubmit() }}
            style={{ width: '100%', padding: '12px 14px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 14 }}
          />
          {pwError && <div style={{ fontSize: 13, color: '#993556', marginTop: 10 }}>{pwError}</div>}
          <button
            onClick={handlePwSubmit}
            style={{ marginTop: 14, width: '100%', padding: 12, background: '#1c1c1c', color: '#fff', border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >확인</button>
        </div>
      </div>
    )
  }

  if (!session) {
    return <div style={{ padding: 40, color: '#6e6e6e', fontSize: 13 }}>세션 정보 로딩 중...</div>
  }

  const selectedPartTotal = getPartTotal(session, selectedPart)
  const threshold = getWinThreshold(selectedPartTotal)
  const results = calculateCandidateResults(candidates, ballots, selectedPartTotal, selectedPart)
  const teamProgress = calculateTeamProgress(ballots)
  const partCounts: Record<VotePart, number> = {
    '장로': ballots.filter((b) => b.part === '장로').length,
    '시무권사': ballots.filter((b) => b.part === '시무권사').length,
    '안수집사': ballots.filter((b) => b.part === '안수집사').length,
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '30px 20px', fontFamily: 'Noto Sans KR, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1c1c1c' }}>관리자 대시보드</h1>
        <Link href='/hana-vote/admin/report' style={{ padding: '8px 14px', background: '#1c1c1c', color: '#fff', borderRadius: 4, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>최종 보고서 →</Link>
      </div>
      <p style={{ fontSize: 13, color: '#6e6e6e', paddingBottom: 14, borderBottom: '2px solid #1c1c1c', marginBottom: 24 }}>실시간 집계 모니터링</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1c1c1c' }}>세션 설정</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: '#6e6e6e', display: 'block', marginBottom: 4 }}>세션명</label>
            <input type='text' value={formName} onChange={(e) => setFormName(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6e6e6e', display: 'block', marginBottom: 4 }}>접속 비밀번호</label>
            <input type='text' value={formPassword} onChange={(e) => setFormPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 13 }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          {PARTS.map((p) => (
            <div key={p}>
              <label style={{ fontSize: 12, color: '#6e6e6e', display: 'block', marginBottom: 4 }}>{p} 배포 수</label>
              <input
                type='number' min={1} value={formParticipantsByPart[p]}
                onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setFormParticipantsByPart((prev) => ({ ...prev, [p]: v })) }}
                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === '.') e.preventDefault() }}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 13 }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
          {PARTS.map((p) => {
            const n = Number(formParticipantsByPart[p])
            const th = Number.isFinite(n) && n > 0 ? getWinThreshold(n) : 0
            return (
              <div key={p}>
                <label style={{ fontSize: 12, color: '#6e6e6e', display: 'block', marginBottom: 4 }}>{p} 당선 기준 (자동)</label>
                <div style={{ padding: '10px 12px', background: '#f5f5f5', borderRadius: 4, fontSize: 13, color: '#3c3c3c' }}>찬성 <b style={{ color: '#1c1c1c' }}>{th}</b>표 이상</div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={handleSaveSession} disabled={savingSession} style={{ padding: '10px 20px', background: '#1c1c1c', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: savingSession ? 'wait' : 'pointer', opacity: savingSession ? 0.6 : 1 }}>
            {savingSession ? '저장 중...' : '세션 저장'}
          </button>
          <button onClick={handleToggleFinalize} style={{ padding: '10px 20px', background: session.isFinalized ? '#fff' : '#993556', color: session.isFinalized ? '#1c1c1c' : '#fff', border: '1px solid ' + (session.isFinalized ? '#1c1c1c' : '#993556'), borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {session.isFinalized ? '마감 해제' : '투표 마감'}
          </button>
          {session.isFinalized && <span style={{ fontSize: 13, color: '#993556', fontWeight: 600 }}>● 마감됨</span>}
          {sessionMsg && <span style={{ fontSize: 13, color: '#1c1c1c' }}>{sessionMsg}</span>}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1c1c1c' }}>팀별 진행 현황</h2>
        <div style={{ border: '1px solid #e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '50px 90px 1fr 1fr 80px', padding: '10px 14px', background: '#f5f5f5', fontSize: 12, fontWeight: 700, color: '#3c3c3c' }}>
            <div>팀</div><div>파트</div><div>개표자</div><div>감독자</div><div style={{ textAlign: 'right' }}>입력</div>
          </div>
          {teamProgress.map(({ teamNumber, part, counters, supervisors, ballotCount }) => (
            <div key={teamNumber + '-' + part} style={{ display: 'grid', gridTemplateColumns: '50px 90px 1fr 1fr 80px', padding: '10px 14px', borderTop: '1px solid #e0e0e0', fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: '#1c1c1c' }}>{teamNumber}팀</div>
              <div style={{ color: '#3c3c3c' }}>{part}</div>
              <div style={{ color: '#3c3c3c' }}>{counters.length > 0 ? counters.map((c, i) => <span key={c.name}>{i > 0 && ', '}{c.name} <span style={{ color: '#6e6e6e' }}>({c.count})</span></span>) : '\u2014'}</div>
              <div style={{ color: '#3c3c3c' }}>{supervisors.length > 0 ? supervisors.join(', ') : '\u2014'}</div>
              <div style={{ textAlign: 'right', fontWeight: 600, color: '#1c1c1c' }}>{ballotCount}장</div>
            </div>
          ))}
          {teamProgress.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#6e6e6e', fontSize: 13 }}>아직 입력된 표가 없습니다</div>}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1c1c1c' }}>후보별 실시간 집계</h2>
        <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', marginBottom: 14 }}>
          {(['장로', '시무권사', '안수집사'] as VotePart[]).map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPart(p)}
              style={{
                padding: '10px 20px', background: 'transparent', border: 'none', marginBottom: -1,
                borderBottom: selectedPart === p ? '2px solid #1c1c1c' : '2px solid transparent',
                fontSize: 13, fontWeight: selectedPart === p ? 700 : 400,
                color: selectedPart === p ? '#1c1c1c' : '#6e6e6e', cursor: 'pointer',
              }}
            >
              {p} <span style={{ color: '#6e6e6e', marginLeft: 4 }}>({partCounts[p]})</span>
            </button>
          ))}
        </div>
        <div style={{ border: '1px solid #e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 100px 80px', padding: '10px 14px', background: '#f5f5f5', fontSize: 12, fontWeight: 700, color: '#3c3c3c' }}>
            <div>후보</div>
            <div style={{ textAlign: 'right' }}>찬성</div>
            <div style={{ textAlign: 'right' }}>반대</div>
            <div style={{ textAlign: 'right' }}>무효</div>
            <div style={{ textAlign: 'right' }}>득표율</div>
            <div style={{ textAlign: 'center' }}>판정</div>
          </div>
          {results.map((r) => (
            <div key={r.candidateId} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 100px 80px', padding: '10px 14px', borderTop: '1px solid #e0e0e0', fontSize: 13, alignItems: 'center' }}>
              <div style={{ color: r.isBlue ? '#2563EB' : '#1c1c1c' }}>{r.name}</div>
              <div style={{ textAlign: 'right', fontWeight: 600, color: '#1c1c1c' }}>{r.yes}</div>
              <div style={{ textAlign: 'right', color: '#3c3c3c' }}>{r.no}</div>
              <div style={{ textAlign: 'right', color: '#3c3c3c' }}>{r.invalid}</div>
              <div style={{ textAlign: 'right', color: '#3c3c3c' }}>{r.yesRate.toFixed(1)}%</div>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', fontSize: 11, fontWeight: 700, borderRadius: 3,
                  background: r.isElected ? '#1c1c1c' : '#e0e0e0',
                  color: r.isElected ? '#fff' : '#6e6e6e',
                }}>
                  {r.isElected ? '당선' : '미달'}
                </span>
              </div>
            </div>
          ))}
          {results.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#6e6e6e', fontSize: 13 }}>후보가 없습니다</div>}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: '#6e6e6e' }}>
          {selectedPart} 당선 기준: 배포 {selectedPartTotal}장의 2/3 이상 = 찬성 {threshold}표 이상
        </div>
      </section>

      <section style={{ marginTop: 48, paddingTop: 20, borderTop: '1px dashed #c8c8c8' }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#6e6e6e' }}>관리</h2>
        <p style={{ fontSize: 12, color: '#6e6e6e', marginBottom: 10 }}>
          투표 시작 직전 개표 데이터 초기화가 필요할 때 사용하세요. 현재 {ballots.length}장 입력됨.
        </p>
        <button
          onClick={() => { setResetPw(''); setResetMsg(''); setShowResetModal(true) }}
          style={{ padding: '8px 14px', background: '#fff', color: '#6e6e6e', border: '1px solid #c8c8c8', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
        >투표 데이터 초기화</button>
      </section>

      {showResetModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}
          onClick={() => { if (!resetting) { setShowResetModal(false); setResetPw(''); setResetMsg('') } }}
        >
          <div style={{ background: '#fff', borderRadius: 8, padding: '32px 28px', width: '100%', maxWidth: 360, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1c1c1c', marginBottom: 6 }}>투표 데이터 초기화</h3>
            <p style={{ fontSize: 13, color: '#6e6e6e', marginBottom: 16 }}>
              모든 개표 데이터({ballots.length}장)가 삭제됩니다. 관리자 비밀번호를 입력하세요.
            </p>
            <input
              type='password' placeholder='관리자 비밀번호' value={resetPw} autoFocus
              onChange={(e) => setResetPw(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleReset() }}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 14, marginBottom: 12 }}
            />
            {resetMsg && (
              <div style={{ fontSize: 13, color: resetMsg.includes('완료') ? '#1c1c1c' : '#993556', marginBottom: 12 }}>{resetMsg}</div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setShowResetModal(false); setResetPw(''); setResetMsg('') }}
                disabled={resetting}
                style={{ flex: 1, padding: 10, background: '#fff', color: '#1c1c1c', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}
              >취소</button>
              <button
                onClick={handleReset}
                disabled={resetting || !resetPw}
                style={{ flex: 1, padding: 10, background: '#993556', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: resetting ? 'wait' : 'pointer', opacity: resetting || !resetPw ? 0.6 : 1 }}
              >{resetting ? '삭제 중...' : '초기화'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
