import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { VotePart } from '@/types/vote'

export interface QueuedBallot {
  localId: string
  teamNumber: number
  counterName: string
  supervisorName: string
  part: VotePart
  isAllInvalid: boolean
  votes: Record<string, 'no' | 'invalid'>
  createdAtMs: number
}

const KEY = 'hanaVoteBallotQueue'

export function getQueuedBallots(): QueuedBallot[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as QueuedBallot[]) : []
  } catch {
    return []
  }
}

function writeQueue(items: QueuedBallot[]): void {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function enqueueBallot(item: Omit<QueuedBallot, 'localId' | 'createdAtMs'>): QueuedBallot {
  const entry: QueuedBallot = {
    ...item,
    localId: (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10),
    createdAtMs: Date.now(),
  }
  const items = getQueuedBallots()
  items.push(entry)
  writeQueue(items)
  return entry
}

export function removeBallotFromQueue(localId: string): void {
  writeQueue(getQueuedBallots().filter((b) => b.localId !== localId))
}

export async function flushQueue(
  onItemSuccess?: (remaining: QueuedBallot[]) => void
): Promise<{ flushed: number; remaining: number }> {
  const items = getQueuedBallots()
  let flushed = 0
  for (const item of items) {
    try {
      await addDoc(collection(db, 'ballots'), {
        teamNumber: item.teamNumber,
        counterName: item.counterName,
        supervisorName: item.supervisorName,
        part: item.part,
        isAllInvalid: item.isAllInvalid,
        votes: item.isAllInvalid ? {} : item.votes,
        createdAt: Timestamp.fromMillis(item.createdAtMs),
        updatedAt: Timestamp.now(),
      })
      removeBallotFromQueue(item.localId)
      flushed++
      onItemSuccess?.(getQueuedBallots())
    } catch (e) {
      console.warn('[queue] flush error, will retry later:', e)
      break
    }
  }
  return { flushed, remaining: getQueuedBallots().length }
}
