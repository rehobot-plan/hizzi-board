'use client';

export type FilterType = 'work' | 'request' | 'personal';
export type FilterMode = 'todo' | 'memo';

interface Props {
  active: Set<FilterType>;
  onChange: (next: Set<FilterType>) => void;
  mode?: FilterMode;
}

const ALL_FILTERS_TODO: FilterType[] = ['work', 'request', 'personal'];
const ALL_FILTERS_MEMO: FilterType[] = ['work', 'personal'];

const FILTER_CONFIG: Record<FilterType, { label: string; color: string }> = {
  work: { label: '업무', color: '#C17B6B' },
  request: { label: '요청', color: '#993556' },
  personal: { label: '개인', color: '#7B5EA7' },
};

export function getDefaultFilters(mode: FilterMode = 'todo'): Set<FilterType> {
  return new Set(mode === 'memo' ? ALL_FILTERS_MEMO : ALL_FILTERS_TODO);
}

export default function TodoFilterBar({ active, onChange, mode = 'todo' }: Props) {
  const filters = mode === 'memo' ? ALL_FILTERS_MEMO : ALL_FILTERS_TODO;
  const allSet = new Set(filters);

  const toggle = (key: FilterType) => {
    const next = new Set(active);
    if (next.has(key)) next.delete(key); else next.add(key);
    if (next.size === 0) onChange(new Set(allSet));
    else onChange(next);
  };

  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
      {filters.map(key => {
        const isOn = active.has(key);
        const cfg = FILTER_CONFIG[key];
        return (
          <button key={key} onClick={() => toggle(key)} data-testid={`filter-${key}`}
            style={{
              padding: '4px 12px', fontSize: 11, borderRadius: 3, cursor: 'pointer',
              border: `1px solid ${isOn ? cfg.color : '#EDE5DC'}`,
              color: isOn ? cfg.color : '#9E8880',
              background: isOn ? `${cfg.color}10` : 'transparent',
              fontWeight: isOn ? 600 : 400, transition: 'all 0.15s',
            }}>
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
