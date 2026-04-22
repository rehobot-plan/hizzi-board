'use client';

export type SegmentType = 'active' | 'completed' | 'trash';
export type SegmentMode = 'todo' | 'memo';

interface Props {
  segment: SegmentType;
  onChange: (s: SegmentType) => void;
  counts: { active: number; completed: number; trash: number };
  onEmptyTrash?: () => void;
  mode?: SegmentMode;
}

const CONFIG: Record<SegmentType, { label: string; memoLabel?: string; color: string }> = {
  active: { label: '진행 중', memoLabel: '표시 중', color: '#C17B6B' },
  completed: { label: '완료', color: '#3B6D11' },
  trash: { label: '휴지통', color: '#9E8880' },
};

export default function TodoSegment({ segment, onChange, counts, onEmptyTrash, mode = 'todo' }: Props) {
  const segments: SegmentType[] = mode === 'memo' ? ['active', 'trash'] : ['active', 'completed', 'trash'];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {segments.map(key => {
          const isActive = segment === key;
          const cfg = CONFIG[key];
          const label = mode === 'memo' && cfg.memoLabel ? cfg.memoLabel : cfg.label;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              data-testid={`segment-${key}`}
              style={{
                padding: '6px 14px', fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? cfg.color : '#9E8880',
                background: isActive ? '#fff' : 'transparent',
                border: isActive ? `1px solid ${cfg.color}` : '1px solid transparent',
                borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {label} {counts[key]}
            </button>
          );
        })}
      </div>
      {segment === 'trash' && counts.trash > 0 && onEmptyTrash && (
        <button onClick={onEmptyTrash} data-testid="empty-trash"
          style={{ fontSize: 11, padding: '5px 12px', color: '#C17B6B', border: '1px solid #C17B6B', background: 'none', borderRadius: 3, cursor: 'pointer' }}>
          휴지통 비우기
        </button>
      )}
    </div>
  );
}
