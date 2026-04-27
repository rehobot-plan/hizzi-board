'use client';

export type RequestSegmentType = 'received' | 'sent' | 'in_progress' | 'done';

interface Props {
  segment: RequestSegmentType;
  onChange: (s: RequestSegmentType) => void;
  counts: Record<RequestSegmentType, number>;
  isAdmin?: boolean;
  showAll?: boolean;
  onShowAllChange?: (v: boolean) => void;
}

const CONFIG: Record<RequestSegmentType, { label: string; color: string }> = {
  received: { label: '받은', color: '#993556' },
  sent: { label: '보낸', color: '#A0503A' },
  in_progress: { label: '진행', color: '#3B6D11' },
  done: { label: '완료', color: '#5C7A5C' },
};

const ORDER: RequestSegmentType[] = ['received', 'sent', 'in_progress', 'done'];

export default function RequestSegment({ segment, onChange, counts, isAdmin, showAll, onShowAllChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onShowAllChange?.(!showAll)}
            data-testid="request-show-all"
            style={{
              padding: '4px 12px',
              fontSize: 11,
              borderRadius: 3,
              cursor: 'pointer',
              border: `1px solid ${showAll ? '#5C1F1F' : '#EDE5DC'}`,
              color: showAll ? '#F5E6E0' : '#9E8880',
              background: showAll ? '#5C1F1F' : 'transparent',
              fontWeight: showAll ? 600 : 400,
              transition: 'all 0.15s ease',
            }}
          >
            전체보기 (admin)
          </button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {ORDER.map(key => {
        const isActive = segment === key;
        const cfg = CONFIG[key];
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            data-testid={`request-segment-${key}`}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? cfg.color : '#9E8880',
              background: isActive ? '#fff' : 'transparent',
              border: isActive ? `1px solid ${cfg.color}` : '1px solid transparent',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cfg.label} {counts[key]}
          </button>
        );
      })}
      </div>
    </div>
  );
}
