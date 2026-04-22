'use client';

import { useState } from 'react';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import RequestDetailPopup from '@/components/request/RequestDetailPopup';

export interface UrgentItem {
  id: string;
  type: 'todo' | 'event' | 'request';
  title: string;
  leftBorderColor: string;
  rightBadge: { kind: string; value: string; color: string; bg: string };
  sortKey: number;
}

interface UrgentListProps {
  items: UrgentItem[];
}

export default function UrgentList({ items }: UrgentListProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const requests = useTodoRequestStore(s => s.requests);
  const matched = selectedRequestId ? (requests.find(r => r.id === selectedRequestId) ?? null) : null;

  if (items.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#9E8880' }}>오늘 특별한 일정이 없어요</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(item => (
          <div
            key={`${item.type}-${item.id}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#fff', border: '1px solid #EDE5DC',
              borderLeft: `3px solid ${item.leftBorderColor}`,
              borderRadius: 4, padding: '10px 16px',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FDF8F4'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            onClick={() => {
              if (item.type === 'request') setSelectedRequestId(item.id);
              // TODO: type='todo' | 'event' Phase 2 이후 모달 연결
            }}
          >
            <span style={{ fontSize: 13, color: '#2C1810', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.title}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
              background: item.rightBadge.bg, color: item.rightBadge.color,
              flexShrink: 0, marginLeft: 8,
            }}>
              {item.rightBadge.value}
            </span>
          </div>
        ))}
      </div>

      <RequestDetailPopup
        request={matched}
        isOpen={!!matched}
        onClose={() => setSelectedRequestId(null)}
      />
    </>
  );
}
