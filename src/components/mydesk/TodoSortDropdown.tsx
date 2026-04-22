'use client';

import { useState, useRef, useEffect } from 'react';
import { SegmentType } from './TodoSegment';

export type SortKey = 'due-asc' | 'newest' | 'oldest' | 'name' | 'category' | 'completed-desc' | 'completed-asc' | 'deleted-desc' | 'deleted-asc';

interface SortOption { key: SortKey; label: string }

const SORT_OPTIONS: Record<SegmentType, { default: SortKey; options: SortOption[] }> = {
  active: {
    default: 'due-asc',
    options: [
      { key: 'due-asc', label: '기한 임박순' },
      { key: 'newest', label: '최신 등록순' },
      { key: 'oldest', label: '오래된 등록순' },
      { key: 'name', label: '이름순' },
      { key: 'category', label: '카테고리순' },
    ],
  },
  completed: {
    default: 'completed-desc',
    options: [
      { key: 'completed-desc', label: '최근 완료순' },
      { key: 'completed-asc', label: '오래된 완료순' },
      { key: 'name', label: '이름순' },
      { key: 'category', label: '카테고리순' },
    ],
  },
  trash: {
    default: 'deleted-desc',
    options: [
      { key: 'deleted-desc', label: '최근 삭제순' },
      { key: 'deleted-asc', label: '오래된 삭제순' },
      { key: 'name', label: '이름순' },
      { key: 'category', label: '카테고리순' },
    ],
  },
};

interface Props {
  segment: SegmentType;
  sortKey: SortKey;
  onChange: (key: SortKey) => void;
}

export function getDefaultSort(segment: SegmentType, mode: 'todo' | 'memo' = 'todo'): SortKey {
  if (mode === 'memo' && segment === 'active') return 'newest';
  return SORT_OPTIONS[segment].default;
}

export default function TodoSortDropdown({ segment, sortKey, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const opts = SORT_OPTIONS[segment];
  const currentLabel = opts.options.find(o => o.key === sortKey)?.label || '';

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        data-testid="sort-dropdown"
        style={{
          padding: '4px 12px', fontSize: 11, color: '#9E8880',
          border: '1px solid #EDE5DC', borderRadius: 3, background: '#fff', cursor: 'pointer',
        }}
      >
        {currentLabel} ▾
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
          background: '#fff', border: '1px solid #EDE5DC', borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: 140,
        }}>
          {opts.options.map(o => (
            <button
              key={o.key}
              onClick={() => { onChange(o.key); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', fontSize: 11, border: 'none', cursor: 'pointer',
                background: o.key === sortKey ? '#FDF8F4' : 'transparent',
                color: o.key === sortKey ? '#2C1810' : '#9E8880',
                fontWeight: o.key === sortKey ? 600 : 400,
              }}
              onMouseEnter={e => { if (o.key !== sortKey) e.currentTarget.style.background = '#FDF8F4'; }}
              onMouseLeave={e => { if (o.key !== sortKey) e.currentTarget.style.background = 'transparent'; }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
