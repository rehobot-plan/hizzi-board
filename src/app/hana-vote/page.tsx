'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useVoteStore } from '@/store/voteStore'
import type { VotePart } from '@/types/vote'

export default function HanaVoteLoginPage() {
  const router = useRouter()
  const { login, loginSession, restoreLogin } = useVoteStore()
  const [teamNumber, setTeamNumber] = useState('')
  const [selectedPart, setSelectedPart] = useState<VotePart | ''>('')
  const [password, setPassword] = useState('')
  const [counterName, setCounterName] = useState('')
  const [supervisorName, setSupervisorName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionName, setSessionName] = useState('')

  useEffect(() => { restoreLogin() }, [restoreLogin])

  useEffect(() => {
    getDoc(doc(db, 'voteSessions', 'current')).then((snap) => {
      if (snap.exists()) setSessionName((snap.data().sessionName as string) || '')
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (loginSession) router.push('/hana-vote/ballot')
  }, [loginSession, router])

  const handleSubmit = async () => {
    setError('')
    if (!teamNumber || !selectedPart || !password || !counterName.trim() || !supervisorName.trim()) {
      setError('모든 칸을 입력하고 담당 파트를 선택해주세요.')
      return
    }
    setLoading(true)
    const result = await login(Number(teamNumber), selectedPart, password, counterName.trim(), supervisorName.trim())
    setLoading(false)
    if (!result.success) setError(result.error || '로그인에 실패했습니다.')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSubmit() }
  const parts: VotePart[] = ['장로', '시무권사', '안수집사']

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '20px', paddingLeft: 'max(20px, calc(50vw - 390px))', position: 'relative', backgroundImage: 'url(/church-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.55)' }} />
      <div style={{ width: '100%', maxWidth: '380px', background: '#fff', padding: '40px 32px', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', color: '#1c1c1c' }}>{sessionName || '중직자 선거 개표'}</h1>
        <p style={{ fontSize: '13px', color: '#6e6e6e', marginBottom: '24px' }}>팀 번호 · 담당 파트 · 비밀번호를 입력하세요</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ fontSize: 11, color: '#6e6e6e', marginBottom: 5 }}>팀 번호</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => {
                const active = teamNumber === String(n)
                return (
                  <button
                    key={n} type='button' onClick={() => setTeamNumber(String(n))}
                    style={{
                      padding: '10px 4px',
                      border: '1px solid ' + (active ? '#1c1c1c' : '#e0e0e0'),
                      borderRadius: 4, fontSize: 13, textAlign: 'center',
                      background: active ? '#1c1c1c' : '#fff',
                      color: active ? '#fff' : '#3c3c3c',
                      fontWeight: active ? 500 : 400,
                      cursor: 'pointer', transition: '0.15s ease',
                    }}
                  >{n}팀</button>
                )
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#6e6e6e', marginBottom: 5 }}>담당 파트</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {parts.map((p) => {
                const active = selectedPart === p
                return (
                  <button
                    key={p} type='button' onClick={() => setSelectedPart(p)}
                    style={{
                      padding: '10px 4px',
                      border: '1px solid ' + (active ? '#1c1c1c' : '#e0e0e0'),
                      borderRadius: 4, fontSize: 13, textAlign: 'center',
                      background: active ? '#1c1c1c' : '#fff',
                      color: active ? '#fff' : '#3c3c3c',
                      fontWeight: active ? 500 : 400,
                      cursor: 'pointer', transition: '0.15s ease',
                    }}
                  >{p}</button>
                )
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#6e6e6e', marginBottom: 5 }}>접속 비밀번호</div>
            <input
              type='password' placeholder='비밀번호' value={password}
              onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#6e6e6e', marginBottom: 5 }}>개표자 이름</div>
            <input
              type='text' placeholder='이름' value={counterName}
              onChange={(e) => setCounterName(e.target.value)} onKeyDown={handleKeyDown}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#6e6e6e', marginBottom: 5 }}>감독자 이름</div>
            <input
              type='text' placeholder='감독자 이름' value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)} onKeyDown={handleKeyDown}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <div style={{ fontSize: '13px', color: '#993556', padding: '8px 12px', background: '#fef0f3', borderRadius: '4px' }}>{error}</div>
          )}

          <button
            onClick={handleSubmit} disabled={loading}
            style={{ marginTop: '6px', padding: '12px', background: '#1c1c1c', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1, transition: '0.15s ease' }}
          >{loading ? '확인 중...' : '입장'}</button>
        </div>
      </div>
    </div>
  )
}
