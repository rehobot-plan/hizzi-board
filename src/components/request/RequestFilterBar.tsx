'use client';

import type { RequestSegmentType } from './RequestSegment';

export type DoneStatusFilter = 'completed' | 'rejected' | 'cancelled';

interface Props {
  segment: RequestSegmentType;
  /** counterpart email 후보 (요청자 또는 담당자). 빈 배열이면 필터 비활성. */
  counterpartOptions: string[];
  counterpartActive: Set<string>;
  onCounterpartChange: (next: Set<string>) => void;
  /** done 세그먼트 한정 — 종결 상태 다중 토글. */
  doneStatus: Set<DoneStatusFilter>;
  onDoneStatusChange: (next: Set<DoneStatusFilter>) => void;
  /** counterpart email → 표시명 매핑. */
  nameOf: (email: string) => string;
}

const DONE_STATUS_CONFIG: Record<DoneStatusFilter, { label: string; color: string }> = {
  completed: { label: '완료', color: '#5C7A5C' },
  rejected: { label: '반려', color: '#993556' },
  cancelled: { label: '취소', color: '#9E8880' },
};

const DONE_ORDER: DoneStatusFilter[] = ['completed', 'rejected', 'cancelled'];

export default function RequestFilterBar({
  segment,
  counterpartOptions,
  counterpartActive,
  onCounterpartChange,
  doneStatus,
  onDoneStatusChange,
  nameOf,
}: Props) {
  const toggleCounterpart = (email: string) => {
    const next = new Set(counterpartActive);
    if (next.has(email)) next.delete(email);
    else next.add(email);
    onCounterpartChange(next);
  };

  const toggleDoneStatus = (key: DoneStatusFilter) => {
    const next = new Set(doneStatus);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    if (next.size === 0) onDoneStatusChange(new Set(DONE_ORDER));
    else onDoneStatusChange(next);
  };

  const showCounterpart = counterpartOptions.length > 0;
  const showDoneStatus = segment === 'done';

  if (!showCounterpart && !showDoneStatus) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
      {showDoneStatus && DONE_ORDER.map(key => {
        const isOn = doneStatus.has(key);
        const cfg = DONE_STATUS_CONFIG[key];
        return (
          <button
            key={`done-${key}`}
            onClick={() => toggleDoneStatus(key)}
            data-testid={`request-filter-done-${key}`}
            style={{
              padding: '4px 12px',
              fontSize: 11,
              borderRadius: 3,
              cursor: 'pointer',
              border: `1px solid ${isOn ? cfg.color : '#EDE5DC'}`,
              color: isOn ? cfg.color : '#9E8880',
              background: isOn ? `${cfg.color}10` : 'transparent',
              fontWeight: isOn ? 600 : 400,
              transition: 'all 0.15s ease',
            }}
          >
            {cfg.label}
          </button>
        );
      })}
      {showCounterpart && counterpartOptions.map(email => {
        const isOn = counterpartActive.has(email);
        return (
          <button
            key={`cp-${email}`}
            onClick={() => toggleCounterpart(email)}
            data-testid={`request-filter-counterpart-${email}`}
            style={{
              padding: '4px 12px',
              fontSize: 11,
              borderRadius: 3,
              cursor: 'pointer',
              border: `1px solid ${isOn ? '#A0503A' : '#EDE5DC'}`,
              color: isOn ? '#A0503A' : '#9E8880',
              background: isOn ? '#A0503A10' : 'transparent',
              fontWeight: isOn ? 600 : 400,
              transition: 'all 0.15s ease',
            }}
          >
            {nameOf(email)}
          </button>
        );
      })}
    </div>
  );
}
