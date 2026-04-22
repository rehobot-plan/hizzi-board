/**
 * 요청 3분기 카운트 순수 계산 — zustand/firebase 의존성 없음, 단위 테스트 가능.
 * 훅 래핑은 @/hooks/useSidebarBadges.
 */

export interface SidebarBadges {
  receivedPending: number;  // toEmail=나 + status=pending
  sentPending: number;      // fromEmail=나 + status=pending
  inProgress: number;       // toEmail=나 + status=accepted
}

export interface RequestForBadges {
  fromEmail?: string;
  toEmail?: string;
  status?: string;
}

export function computeBadges(requests: RequestForBadges[], email: string): SidebarBadges {
  return {
    receivedPending: requests.filter(r => r.toEmail === email && r.status === 'pending').length,
    sentPending: requests.filter(r => r.fromEmail === email && r.status === 'pending').length,
    inProgress: requests.filter(r => r.toEmail === email && r.status === 'accepted').length,
  };
}
