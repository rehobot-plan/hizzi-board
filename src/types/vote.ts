export type VotePart = '장로' | '시무권사' | '안수집사'

export interface VoteSession {
  id: string
  sessionName: string
  accessPassword: string
  totalParticipants: number
  totalParticipantsByPart?: {
    '장로'?: number
    '시무권사'?: number
    '안수집사'?: number
  }
  isFinalized: boolean
  finalizedAt?: unknown
  createdAt: unknown
  updatedAt: unknown
}

export interface Candidate {
  id: string
  part: VotePart
  name: string
  order: number
  isBlue?: boolean
  createdAt: unknown
}

export interface Team {
  id: string
  teamNumber: number
  part: VotePart
  counters: string[]
  supervisor: string
  createdAt: unknown
}

export interface Ballot {
  id: string
  teamNumber: number
  counterName: string
  supervisorName?: string
  part: VotePart
  isAllInvalid: boolean
  votes: Record<string, 'no' | 'invalid'>
  createdAt: unknown
  updatedAt: unknown
}

export interface VoteLoginSession {
  teamNumber: number
  part: VotePart
  counterName: string
  supervisorName: string
}
