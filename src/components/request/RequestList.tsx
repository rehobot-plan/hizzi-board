'use client';

import { useState } from 'react';
import { useTodoRequestStore, TodoRequest } from '@/store/todoRequestStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import RequestDetailPopup from './RequestDetailPopup';

type Tab = 'received' | 'sent';

const STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: '대기', bg: '#FBEAF0', fg: '#993556' },
  accepted: { label: '수락됨', bg: '#EAF3DE', fg: '#3B6D11' },
  cancel_requested: { label: '취소 대기', bg: '#FAEEDA', fg: '#854F0B' },
  completed: { label: '완료', bg: '#F0F5F0', fg: '#5C7A5C' },
  rejected: { label: '반려', bg: '#FBEAF0', fg: '#993556' },
  cancelled: { label: '취소됨', bg: '#F5F0EE', fg: '#9E8880' },
};

export default function RequestList() {
  const [tab, setTab] = useState<Tab>('received');
  const [showAll, setShowAll] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { requests } = useTodoRequestStore();

  const selectedRequest = selectedId ? requests.find(r => r.id === selectedId) || null : null;
  const { users } = useUserStore();

  const isAdmin = user?.role === 'admin';
  const email = user?.email || '';

  const nameOf = (e: string) => users.find(u => u.email === e)?.name || e;

  const filtered = showAll && isAdmin
    ? requests
    : tab === 'received'
      ? requests.filter(r => r.toEmail === email)
      : requests.filter(r => r.fromEmail === email);

  const isDimmed = (s: string) => s === 'completed' || s === 'cancelled';

  const active = filtered.filter(r => !isDimmed(r.status));
  const dimmed = filtered.filter(r => isDimmed(r.status));
  const sorted = [...active, ...dimmed];

  const formatDate = (d?: string) => {
    if (!d) return '';
    const [, m, day] = d.split('-');
    return `${Number(m)}.${Number(day)}`;
  };

  return (
    <div>
      {/* 관리자 전체보기 토글 */}
      {isAdmin && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs px-3 py-1 rounded border transition-all"
            style={{
              background: showAll ? '#5C1F1F' : 'transparent',
              color: showAll ? '#F5E6E0' : '#9E8880',
              borderColor: showAll ? '#5C1F1F' : '#EDE5DC',
            }}
          >
            전체 보기
          </button>
        </div>
      )}

      {/* 탭 */}
      {!showAll && (
        <div className="flex gap-1 mb-6">
          {([['received', '받은 요청'], ['sent', '보낸 요청']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="px-4 py-2 text-xs font-medium rounded transition-all"
              style={{
                background: tab === key ? '#5C1F1F' : 'transparent',
                color: tab === key ? '#F5E6E0' : '#9E8880',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* 목록 */}
      {sorted.length === 0 ? (
        <div className="border border-[#EDE5DC] bg-white rounded p-8 text-center">
          <p className="text-xs text-[#9E8880]">요청이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((req) => {
            const dim = isDimmed(req.status);
            const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const counterpart = tab === 'received' || showAll
              ? `From ${nameOf(req.fromEmail)}`
              : `To ${nameOf(req.toEmail)}`;

            return (
              <div
                key={req.id}
                className="flex items-center bg-white border border-[#EDE5DC] rounded cursor-pointer transition-colors"
                style={{
                  opacity: dim ? 0.5 : 1,
                  borderLeft: '2px solid #993556',
                }}
                onClick={() => setSelectedId(req.id)}
                onMouseEnter={e => { if (!dim) e.currentTarget.style.background = '#FDF8F4'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                <div className="flex-1 px-4 py-3 min-w-0">
                  <div className="text-sm text-[#2C1810] font-medium truncate">{req.title}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#FBEAF0', color: '#993556' }}>요청</span>
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#FCEEE9', color: '#A0503A' }}>{counterpart}</span>
                    {showAll && isAdmin && (
                      <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#F5F0EE', color: '#9E8880' }}>
                        → {nameOf(req.toEmail)}
                      </span>
                    )}
                    {req.teamLabel && (
                      <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#F5F0EE', color: '#9E8880' }}>TEAM</span>
                    )}
                    {req.dueDate && (
                      <span className="text-[10px] text-[#993556]">
                        ⏱ {formatDate(req.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-4 flex-shrink-0">
                  <span
                    className="text-[10px] px-2 py-1 rounded font-medium"
                    style={{ background: status.bg, color: status.fg }}
                  >
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RequestDetailPopup
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
