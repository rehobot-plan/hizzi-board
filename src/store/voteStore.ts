import { create } from 'zustand'
import {
  doc, getDoc, collection, query, where,
  onSnapshot, addDoc, updateDoc, deleteDoc, Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { VoteSession, Candidate, Ballot, VoteLoginSession, VotePart } from '@/types/vote'
import {
  enqueueBallot, getQueuedBallots, flushQueue as flushQueueModule,
  type QueuedBallot,
} from '@/lib/ballotQueue'

interface LoginResult {
  success: boolean
  error?: string
}

interface VoteState {
  session: VoteSession | null
  loginSession: VoteLoginSession | null
  candidates: Candidate[]
  myBallots: Ballot[]
  queuedBallots: QueuedBallot[]
  unsubs: Array<() => void>

  login: (teamNumber: number, selectedPart: VotePart, password: string, counterName: string, supervisorName: string) => Promise<LoginResult>
  restoreLogin: () => void
  logout: () => void

  initListeners: (loginSession: VoteLoginSession) => void
  cleanupListeners: () => void

  saveBallot: (votes: Record<string, 'no' | 'invalid'>, isAllInvalid: boolean) => Promise<void>
  updateBallot: (id: string, votes: Record<string, 'no' | 'invalid'>, isAllInvalid: boolean) => Promise<void>
  deleteBallot: (id: string) => Promise<void>

  refreshQueue: () => void
  flushQueue: () => Promise<{ flushed: number; remaining: number }>
}

const SESSION_STORAGE_KEY = 'hanaVoteLogin'
const ADD_DOC_TIMEOUT_MS = 5000

function filterQueueForLogin(items: QueuedBallot[], loginSession: VoteLoginSession): QueuedBallot[] {
  return items
    .filter((b) =>
      b.teamNumber === loginSession.teamNumber &&
      b.part === loginSession.part &&
      b.counterName === loginSession.counterName
    )
    .sort((a, b) => a.createdAtMs - b.createdAtMs)
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('addDoc timeout')), ms)
    p.then((v) => { clearTimeout(t); resolve(v) }).catch((e) => { clearTimeout(t); reject(e) })
  })
}

export const useVoteStore = create<VoteState>((set, get) => ({
  session: null,
  loginSession: null,
  candidates: [],
  myBallots: [],
  queuedBallots: [],
  unsubs: [],

  login: async (teamNumber, selectedPart, password, counterName, supervisorName) => {
    try {
      const sessionRef = doc(db, 'voteSessions', 'current')
      const sessionSnap = await getDoc(sessionRef)
      if (!sessionSnap.exists()) {
        return { success: false, error: '투표 세션이 설정되지 않았습니다.' }
      }
      const sessionData = { id: 'current', ...sessionSnap.data() } as VoteSession

      if (sessionData.isFinalized) {
        return { success: false, error: '투표가 마감되었습니다.' }
      }
      if (sessionData.accessPassword !== password) {
        return { success: false, error: '비밀번호가 일치하지 않습니다.' }
      }

      const loginSession: VoteLoginSession = {
        teamNumber,
        part: selectedPart,
        counterName,
        supervisorName,
      }

      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(loginSession))
      set({ session: sessionData, loginSession })
      return { success: true }
    } catch (e) {
      console.error(e)
      return { success: false, error: '로그인 중 오류가 발생했습니다.' }
    }
  },

  restoreLogin: () => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return
    try {
      const loginSession = JSON.parse(raw) as VoteLoginSession
      set({ loginSession })
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
  },

  logout: () => {
    get().cleanupListeners()
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    set({ loginSession: null, session: null, candidates: [], myBallots: [], queuedBallots: [] })
  },

  initListeners: (loginSession) => {
    get().cleanupListeners()
    const unsubs: Array<() => void> = []

    unsubs.push(
      onSnapshot(doc(db, 'voteSessions', 'current'), (snap) => {
        if (snap.exists()) {
          set({ session: { id: 'current', ...snap.data() } as VoteSession })
        }
      }, (err) => console.error('session listener error:', err))
    )

    const candsQuery = query(
      collection(db, 'candidates'),
      where('part', '==', loginSession.part)
    )
    unsubs.push(
      onSnapshot(candsQuery, (snap) => {
        const list: Candidate[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Candidate))
        list.sort((a, b) => a.order - b.order)
        set({ candidates: list })
      }, (err) => console.error('candidates listener error:', err))
    )

    const ballotsQuery = query(
      collection(db, 'ballots'),
      where('counterName', '==', loginSession.counterName)
    )
    unsubs.push(
      onSnapshot(ballotsQuery, (snap) => {
        const list: Ballot[] = snap.docs
          .filter((d) => d.data().createdAt != null)
          .map((d) => ({ id: d.id, ...d.data() } as Ballot))
          .filter((b) => b.teamNumber === loginSession.teamNumber && b.part === loginSession.part)
          .sort((a, b) => {
            const ta = (a.createdAt as { toMillis?: () => number } | null)?.toMillis?.() ?? 0
            const tb = (b.createdAt as { toMillis?: () => number } | null)?.toMillis?.() ?? 0
            return ta - tb
          })
        set({ myBallots: list })
      }, (err) => console.error('ballots listener error:', err))
    )

    set({ unsubs, queuedBallots: filterQueueForLogin(getQueuedBallots(), loginSession) })
  },

  cleanupListeners: () => {
    get().unsubs.forEach((u) => u())
    set({ unsubs: [] })
  },

  saveBallot: async (votes, isAllInvalid) => {
    const { loginSession, session } = get()
    if (!loginSession) throw new Error('로그인 세션이 없습니다.')
    if (session?.isFinalized) throw new Error('투표가 마감되어 저장할 수 없습니다.')

    const payload = {
      teamNumber: loginSession.teamNumber,
      counterName: loginSession.counterName,
      supervisorName: loginSession.supervisorName,
      part: loginSession.part,
      isAllInvalid,
      votes: isAllInvalid ? {} : votes,
    }

    const online = typeof navigator === 'undefined' ? true : navigator.onLine

    if (online) {
      try {
        await withTimeout(
          addDoc(collection(db, 'ballots'), {
            ...payload,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          }),
          ADD_DOC_TIMEOUT_MS
        )
        return
      } catch (e) {
        console.warn('[saveBallot] online addDoc failed, enqueueing:', e)
      }
    }

    enqueueBallot(payload)
    set({ queuedBallots: filterQueueForLogin(getQueuedBallots(), loginSession) })
  },

  updateBallot: async (id, votes, isAllInvalid) => {
    const { session } = get()
    if (session?.isFinalized) throw new Error('투표가 마감되어 저장할 수 없습니다.')

    const ref = doc(db, 'ballots', id)
    await updateDoc(ref, {
      isAllInvalid,
      votes: isAllInvalid ? {} : votes,
      updatedAt: Timestamp.now(),
    })
  },

  deleteBallot: async (id) => {
    const { session } = get()
    if (session?.isFinalized) throw new Error('투표가 마감되어 삭제할 수 없습니다.')
    await deleteDoc(doc(db, 'ballots', id))
  },

  refreshQueue: () => {
    const { loginSession } = get()
    if (!loginSession) { set({ queuedBallots: [] }); return }
    set({ queuedBallots: filterQueueForLogin(getQueuedBallots(), loginSession) })
  },

  flushQueue: async () => {
    const result = await flushQueueModule((remaining) => {
      const { loginSession } = get()
      if (loginSession) {
        set({ queuedBallots: filterQueueForLogin(remaining, loginSession) })
      }
    })
    const { loginSession } = get()
    if (loginSession) {
      set({ queuedBallots: filterQueueForLogin(getQueuedBallots(), loginSession) })
    } else {
      set({ queuedBallots: [] })
    }
    return result
  },
}))
