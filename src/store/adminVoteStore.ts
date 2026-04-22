import { create } from 'zustand'
import { doc, collection, onSnapshot, updateDoc, Timestamp, getDocs, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { VoteSession, Candidate, Team, Ballot } from '@/types/vote'

interface AdminVoteState {
  session: VoteSession | null
  candidates: Candidate[]
  teams: Team[]
  ballots: Ballot[]
  unsubs: Array<() => void>
  initListeners: () => void
  cleanupListeners: () => void
  updateSession: (data: Partial<Pick<VoteSession, 'sessionName' | 'totalParticipants' | 'totalParticipantsByPart' | 'accessPassword'>>) => Promise<void>
  toggleFinalized: () => Promise<void>
  resetBallots: () => Promise<number>
}

export const useAdminVoteStore = create<AdminVoteState>((set, get) => ({
  session: null,
  candidates: [],
  teams: [],
  ballots: [],
  unsubs: [],

  initListeners: () => {
    get().cleanupListeners()
    const unsubs: Array<() => void> = []

    unsubs.push(
      onSnapshot(doc(db, 'voteSessions', 'current'), (snap) => {
        if (snap.exists()) {
          set({ session: { id: 'current', ...snap.data() } as VoteSession })
        }
      }, (err) => console.error('session listener error:', err))
    )

    unsubs.push(
      onSnapshot(collection(db, 'candidates'), (snap) => {
        const list: Candidate[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Candidate))
        list.sort((a, b) => a.order - b.order)
        set({ candidates: list })
      }, (err) => console.error('candidates listener error:', err))
    )

    unsubs.push(
      onSnapshot(collection(db, 'teams'), (snap) => {
        const list: Team[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Team))
        set({ teams: list })
      }, (err) => console.error('teams listener error:', err))
    )

    unsubs.push(
      onSnapshot(collection(db, 'ballots'), (snap) => {
        const list: Ballot[] = snap.docs
          .filter((d) => d.data().createdAt != null)
          .map((d) => ({ id: d.id, ...d.data() } as Ballot))
        set({ ballots: list })
      }, (err) => console.error('ballots listener error:', err))
    )

    set({ unsubs })
  },

  cleanupListeners: () => {
    get().unsubs.forEach((u) => u())
    set({ unsubs: [] })
  },

  updateSession: async (data) => {
    const ref = doc(db, 'voteSessions', 'current')
    const cleaned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) cleaned[k] = v
    }
    cleaned.updatedAt = Timestamp.now()
    await updateDoc(ref, cleaned)
  },

  toggleFinalized: async () => {
    const { session } = get()
    if (!session) return
    const ref = doc(db, 'voteSessions', 'current')
    const nowFinalized = !session.isFinalized
    await updateDoc(ref, {
      isFinalized: nowFinalized,
      finalizedAt: nowFinalized ? Timestamp.now() : null,
      updatedAt: Timestamp.now(),
    })
  },

  resetBallots: async () => {
    const snap = await getDocs(collection(db, 'ballots'))
    const docs = snap.docs
    const chunkSize = 500
    for (let i = 0; i < docs.length; i += chunkSize) {
      const batch = writeBatch(db)
      docs.slice(i, i + chunkSize).forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
    return docs.length
  },
}))
