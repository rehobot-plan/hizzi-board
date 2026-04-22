'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useVoteStore } from '@/store/voteStore'
import type { Ballot, Candidate } from '@/types/vote'
import type { QueuedBallot } from '@/lib/ballotQueue'

const BLUE = '#2563EB'
const BLACK = '#1c1c1c'

export default function BallotPage() {
  const router = useRouter()
  const {
    loginSession, restoreLogin, logout,
    candidates, myBallots, queuedBallots, session,
    initListeners, cleanupListeners,
    saveBallot, updateBallot, deleteBallot, flushQueue,
  } = useVoteStore()

  const isFinalized = session?.isFinalized === true

  const [votes, setVotes] = useState<Record<string, 'no' | 'invalid'>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isListOpen, setIsListOpen] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState('')
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => { restoreLogin() }, [restoreLogin])

  useEffect(() => {
    if (!loginSession) {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem('hanaVoteLogin') : null
      if (!raw) router.push('/hana-vote')
      return
    }
    initListeners(loginSession)
    return () => cleanupListeners()
  }, [loginSession, router, initListeners, cleanupListeners])

  useEffect(() => {
    if (!loginSession) return
    const handleOnline = () => {
      setIsOffline(false)
      flushQueue().catch((e) => console.warn('[flush] error:', e))
    }
    const handleOffline = () => setIsOffline(true)
    setIsOffline(!navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    if (navigator.onLine) flushQueue().catch((e) => console.warn('[flush] error:', e))
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [loginSession, flushQueue])

  useEffect(() => {
    if (queuedBallots.length === 0) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [queuedBallots.length])

  const handleToggle = (candidateId: string, value: 'no' | 'invalid') => {
    setVotes((prev) => {
      const next = { ...prev }
      if (next[candidateId] === value) delete next[candidateId]
      else next[candidateId] = value
      return next
    })
  }

  const handleSave = async (allInvalid: boolean) => {
    const confirmMsg = allInvalid
      ? '이 표를 전체 무효로 처리하시겠습니까?'
      : editingId
        ? '이 표를 수정 저장하시겠습니까?'
        : '이 표를 저장하고 다음 장으로 넘어가시겠습니까?'
    if (!window.confirm(confirmMsg)) return

    setError('')
    setSaving(true)
    console.log('[ballot] save start', { allInvalid, editingId, votes })
    try {
      if (editingId) await updateBallot(editingId, votes, allInvalid)
      else await saveBallot(votes, allInvalid)
      console.log('[ballot] save success')
      setVotes({})
      setEditingId(null)
      setSavedFlash(allInvalid ? '전체 무효 저장됨' : editingId ? '수정 저장됨' : '저장됨 · 다음 장 입력')
      setTimeout(() => setSavedFlash(''), 1800)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      console.error('[ballot] save error:', e)
      const msg = e instanceof Error ? e.message : String(e)
      setError('저장 실패: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (b: Ballot) => {
    setVotes(b.isAllInvalid ? {} : { ...b.votes })
    setEditingId(b.id)
    setIsListOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 표를 삭제하시겠습니까?')) return
    try {
      await deleteBallot(id)
    } catch (e) {
      console.error(e)
      setError('삭제에 실패했습니다.')
    }
  }

  const handleCancelEdit = () => { setVotes({}); setEditingId(null) }

  const summary = useMemo(() => {
    let yes = 0, no = 0, invalid = 0
    for (const c of candidates) {
      const v = votes[c.id]
      if (v === 'no') no++
      else if (v === 'invalid') invalid++
      else yes++
    }
    return { yes, no, invalid }
  }, [votes, candidates])

  const blackCands = candidates.filter((c) => !c.isBlue)
  const blueCands = candidates.filter((c) => c.isBlue)

  if (!loginSession) return null

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff' }}>
        <div style={{ borderBottom: '1px solid #e0e0e0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: BLACK }}>{loginSession.teamNumber}팀 · {loginSession.part} 개표</div>
            <div style={{ fontSize: 12, color: '#6e6e6e', marginTop: 2 }}>개표자: {loginSession.counterName}{loginSession.supervisorName ? ' · 감독: ' + loginSession.supervisorName : ''}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 13, color: '#3c3c3c' }}>
              입력 완료: <b style={{ color: BLACK }}>{myBallots.length + queuedBallots.length}장</b>
              {queuedBallots.length > 0 && (
                <span style={{ marginLeft: 6, fontSize: 12, color: '#6e6e6e' }}>(대기 {queuedBallots.length})</span>
              )}
            </div>
            <button
              onClick={() => {
                if (!window.confirm('로그아웃하시겠습니까?')) return
                logout()
                router.push('/hana-vote')
              }}
              style={{ padding: '6px 12px', background: '#fff', color: BLACK, border: '1px solid #c8c8c8', borderRadius: 3, fontSize: 12, cursor: 'pointer' }}
            >로그아웃</button>
          </div>
        </div>

        {isFinalized && (
          <div style={{ padding: '12px 20px', background: '#993556', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
            투표가 마감되었습니다. 더 이상 저장/수정/삭제할 수 없습니다.
          </div>
        )}

        {(isOffline || queuedBallots.length > 0) && (
          <div style={{ padding: '10px 20px', background: '#FEF3C7', color: '#78350F', fontSize: 13, fontWeight: 500, textAlign: 'center', borderBottom: '1px solid #F59E0B' }}>
            {isOffline ? '\u26A0 오프라인 · ' : ''}
            대기 중 {queuedBallots.length}장 · 연결 복구 시 자동 저장됩니다. 탭을 닫지 마세요.
          </div>
        )}

        {editingId && (
          <div style={{ padding: '10px 20px', background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>표 수정 중</span>
            <button onClick={handleCancelEdit} style={{ padding: '4px 10px', background: '#fff', border: '1px solid #6e6e6e', borderRadius: 3, fontSize: 12, cursor: 'pointer' }}>수정 취소</button>
          </div>
        )}

        <div style={{ background: '#f5f5f5', padding: '10px 20px', borderBottom: '1px solid #e8e8e8', display: 'flex', gap: 24, fontSize: 12, color: '#3c3c3c', flexWrap: 'wrap' }}>
          <span><b style={{ color: BLACK, fontWeight: 500, marginRight: 6 }}>O</b>아무것도 누르지 않기</span>
          <span><b style={{ color: BLACK, fontWeight: 500, marginRight: 6 }}>X</b>[반대] 버튼</span>
          <span><b style={{ color: BLACK, fontWeight: 500, marginRight: 6 }}>애매함</b>[무효] 버튼</span>
        </div>
      </div>

      <div style={{ padding: '14px 20px' }}>
        {candidates.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#6e6e6e', fontSize: 13 }}>후보를 불러오는 중...</div>
        )}

        {blackCands.length > 0 && <CandGrid candidates={blackCands} votes={votes} onToggle={handleToggle} />}
        {blueCands.length > 0 && (
          <>
            <div style={{ height: 12 }} />
            <CandGrid candidates={blueCands} votes={votes} onToggle={handleToggle} />
          </>
        )}

        <div style={{ marginTop: 18, padding: '12px 16px', background: '#f5f5f5', borderRadius: 4, fontSize: 13, color: '#3c3c3c' }}>
          찬성 <b style={{ color: BLACK }}>{summary.yes}</b> · 반대 <b style={{ color: BLACK }}>{summary.no}</b> · 무효 <b style={{ color: BLACK }}>{summary.invalid}</b>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef0f3', color: '#993556', fontSize: 13, borderRadius: 4, fontWeight: 500 }}>{error}</div>
        )}

        {savedFlash && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0f9f4', color: '#2a7a3f', fontSize: 13, borderRadius: 4, fontWeight: 500 }}>{'\u2713'} {savedFlash}</div>
        )}

        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || candidates.length === 0 || isFinalized}
            style={{ flex: 1, padding: '12px', background: '#fff', color: BLACK, border: '1px solid ' + BLACK, borderRadius: 4, cursor: saving ? 'wait' : 'pointer', fontSize: 13, opacity: (saving || candidates.length === 0 || isFinalized) ? 0.6 : 1 }}
          >전체 무효 처리</button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving || candidates.length === 0 || isFinalized}
            style={{ flex: 2, padding: '12px', background: BLACK, color: '#fff', border: 'none', borderRadius: 4, cursor: saving ? 'wait' : 'pointer', fontSize: 14, fontWeight: 600, opacity: (saving || candidates.length === 0 || isFinalized) ? 0.6 : 1 }}
          >{saving ? '저장 중...' : editingId ? '수정 저장' : '저장 후 다음 장'}</button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <button
          onClick={() => setIsListOpen((v) => !v)}
          style={{ width: '100%', padding: '12px 14px', background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 600, color: BLACK }}
        >내가 입력한 표 ({myBallots.length + queuedBallots.length}장{queuedBallots.length > 0 ? ' · 대기 ' + queuedBallots.length : ''}) {isListOpen ? '\u25B2' : '\u25BC'}</button>
        {isListOpen && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {myBallots.map((b, idx) => (
              <BallotRow key={b.id} index={idx + 1} ballot={b} candidates={candidates} onEdit={() => handleEdit(b)} onDelete={() => handleDelete(b.id)} />
            ))}
            {queuedBallots.map((q, idx) => (
              <QueuedRow key={q.localId} index={myBallots.length + idx + 1} ballot={q} candidates={candidates} />
            ))}
            {myBallots.length + queuedBallots.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#6e6e6e', fontSize: 13 }}>아직 입력한 표가 없습니다</div>
            )}
          </div>
        )}
      </div>

      <div style={{ height: 40 }} />
    </div>
  )
}

interface CandGridProps {
  candidates: Candidate[]
  votes: Record<string, 'no' | 'invalid'>
  onToggle: (id: string, v: 'no' | 'invalid') => void
}

function CandGrid({ candidates, votes, onToggle }: CandGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 6 }}>
      {candidates.map((c) => {
        const isNo = votes[c.id] === 'no'
        const isInv = votes[c.id] === 'invalid'
        return (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 14px', height: 40, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 4 }}>
            <div style={{ fontSize: 14, color: c.isBlue ? BLUE : BLACK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: '1 1 auto', minWidth: 0 }}>{c.name}</div>
            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
              <button
                onClick={() => onToggle(c.id, 'no')}
                style={{ padding: '5px 14px', background: isNo ? BLACK : '#fff', color: isNo ? '#fff' : BLACK, border: '1px solid ' + BLACK, borderRadius: 3, cursor: 'pointer', fontSize: 12, fontWeight: isNo ? 600 : 400, whiteSpace: 'nowrap' }}
              >반대</button>
              <button
                onClick={() => onToggle(c.id, 'invalid')}
                style={{ padding: '5px 14px', background: isInv ? '#6e6e6e' : '#fff', color: isInv ? '#fff' : BLACK, border: '1px solid #6e6e6e', borderRadius: 3, cursor: 'pointer', fontSize: 12, fontWeight: isInv ? 600 : 400, whiteSpace: 'nowrap' }}
              >무효</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface BallotRowProps {
  index: number
  ballot: Ballot
  candidates: Candidate[]
  onEdit: () => void
  onDelete: () => void
}

function BallotRow({ index, ballot, candidates, onEdit, onDelete }: BallotRowProps) {
  const summary = useMemo(() => {
    if (ballot.isAllInvalid) return null
    let yes = 0, no = 0, invalid = 0
    for (const c of candidates) {
      const v = ballot.votes[c.id]
      if (v === 'no') no++
      else if (v === 'invalid') invalid++
      else yes++
    }
    return { yes, no, invalid }
  }, [ballot, candidates])

  let time = ''
  const ts = ballot.createdAt as { toDate?: () => Date } | null | undefined
  if (ts && typeof ts.toDate === 'function') {
    time = ts.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 13 }}>
      <div style={{ color: '#3c3c3c' }}>
        <span style={{ color: '#6e6e6e', marginRight: 8 }}>#{index}</span>
        <span style={{ color: '#6e6e6e', marginRight: 8 }}>{time}</span>
        {ballot.isAllInvalid
          ? <span style={{ fontWeight: 600 }}>전체 무효</span>
          : <span>찬성 {summary!.yes} · 반대 {summary!.no} · 무효 {summary!.invalid}</span>}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={onEdit} style={{ padding: '4px 10px', background: '#fff', border: '1px solid #6e6e6e', borderRadius: 3, fontSize: 12, cursor: 'pointer' }}>수정</button>
        <button onClick={onDelete} style={{ padding: '4px 10px', background: '#fff', border: '1px solid #1c1c1c', color: '#1c1c1c', borderRadius: 3, fontSize: 12, cursor: 'pointer' }}>삭제</button>
      </div>
    </div>
  )
}

interface QueuedRowProps {
  index: number
  ballot: QueuedBallot
  candidates: Candidate[]
}

function QueuedRow({ index, ballot, candidates }: QueuedRowProps) {
  const summary = useMemo(() => {
    if (ballot.isAllInvalid) return null
    let yes = 0, no = 0, invalid = 0
    for (const c of candidates) {
      const v = ballot.votes[c.id]
      if (v === 'no') no++
      else if (v === 'invalid') invalid++
      else yes++
    }
    return { yes, no, invalid }
  }, [ballot, candidates])

  const time = new Date(ballot.createdAtMs).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fafafa', border: '1px dashed #c8c8c8', borderRadius: 4, fontSize: 13 }}>
      <div style={{ color: '#6e6e6e' }}>
        <span style={{ marginRight: 8 }}>#{index}</span>
        <span style={{ marginRight: 8 }}>{time}</span>
        {ballot.isAllInvalid
          ? <span style={{ fontWeight: 600 }}>전체 무효</span>
          : <span>찬성 {summary!.yes} · 반대 {summary!.no} · 무효 {summary!.invalid}</span>}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ padding: '3px 8px', background: '#fff8e1', color: '#8a6d1a', border: '1px solid #e6d08a', borderRadius: 3, fontSize: 11, fontWeight: 600 }}>동기화 중</span>
      </div>
    </div>
  )
}
