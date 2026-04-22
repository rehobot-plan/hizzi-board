import type { Candidate, Ballot, VotePart, VoteSession } from '@/types/vote'

export function getPartTotal(session: VoteSession, part: VotePart): number {
  return session.totalParticipantsByPart?.[part] ?? session.totalParticipants ?? 0
}

export interface CandidateResult {
  candidateId: string
  name: string
  isBlue: boolean
  yes: number
  no: number
  invalid: number
  yesRate: number
  isElected: boolean
}

export function getWinThreshold(totalParticipants: number): number {
  if (totalParticipants <= 0) return 0
  return Math.ceil((totalParticipants * 2) / 3)
}

export function calculateCandidateResults(
  candidates: Candidate[],
  ballots: Ballot[],
  totalParticipants: number,
  part: VotePart
): CandidateResult[] {
  const partBallots = ballots.filter((b) => b.part === part)
  const threshold = getWinThreshold(totalParticipants)

  const results: CandidateResult[] = candidates
    .filter((c) => c.part === part)
    .map((c) => {
      let yes = 0, no = 0, invalid = 0
      for (const b of partBallots) {
        if (b.isAllInvalid) {
          invalid++
          continue
        }
        const v = b.votes?.[c.id]
        if (v === 'no') no++
        else if (v === 'invalid') invalid++
        else yes++
      }
      const yesRate = totalParticipants > 0 ? (yes / totalParticipants) * 100 : 0
      return {
        candidateId: c.id,
        name: c.name,
        isBlue: c.isBlue === true,
        yes, no, invalid,
        yesRate,
        isElected: yes >= threshold,
      }
    })

  results.sort((a, b) => b.yes - a.yes)
  return results
}

export interface PartStats {
  part: VotePart
  totalParticipants: number
  threshold: number
  validCount: number
  invalidCount: number
  missingCount: number
  candidateCount: number
  electedCount: number
  rejectedCount: number
}

export function calculatePartStats(
  ballots: Ballot[],
  candidates: Candidate[],
  part: VotePart,
  totalParticipants: number
): PartStats {
  const partBallots = ballots.filter((b) => b.part === part)
  const validCount = partBallots.filter((b) => !b.isAllInvalid).length
  const invalidCount = partBallots.filter((b) => b.isAllInvalid).length
  const missingCount = Math.max(0, totalParticipants - validCount - invalidCount)
  const partCandidates = candidates.filter((c) => c.part === part)
  const candidateCount = partCandidates.length
  const results = calculateCandidateResults(candidates, ballots, totalParticipants, part)
  const electedCount = results.filter((r) => r.isElected).length
  const rejectedCount = candidateCount - electedCount
  return {
    part,
    totalParticipants,
    threshold: getWinThreshold(totalParticipants),
    validCount,
    invalidCount,
    missingCount,
    candidateCount,
    electedCount,
    rejectedCount,
  }
}

export interface CounterEntry {
  name: string
  count: number
}

export interface TeamProgress {
  teamNumber: number
  part: VotePart
  counters: CounterEntry[]
  supervisors: string[]
  ballotCount: number
}

export function calculateTeamProgress(ballots: Ballot[]): TeamProgress[] {
  const map = new Map<string, { teamNumber: number; part: VotePart; counterMap: Map<string, number>; supervisors: Set<string>; count: number }>()
  for (const b of ballots) {
    const key = b.teamNumber + '-' + b.part
    if (!map.has(key)) {
      map.set(key, { teamNumber: b.teamNumber, part: b.part, counterMap: new Map(), supervisors: new Set(), count: 0 })
    }
    const g = map.get(key)!
    g.counterMap.set(b.counterName, (g.counterMap.get(b.counterName) ?? 0) + 1)
    if (b.supervisorName) g.supervisors.add(b.supervisorName)
    g.count++
  }
  return [...map.values()]
    .map((g) => ({
      teamNumber: g.teamNumber,
      part: g.part,
      counters: [...g.counterMap.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      supervisors: [...g.supervisors].sort(),
      ballotCount: g.count,
    }))
    .sort((a, b) => {
      if (a.teamNumber !== b.teamNumber) return a.teamNumber - b.teamNumber
      return a.part.localeCompare(b.part)
    })
}
