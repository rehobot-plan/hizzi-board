'use client';

import type { TodoRequest } from '@/store/todoRequestStore';
import type { RequestSegmentType } from './RequestSegment';

const STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: '대기', bg: '#FBEAF0', fg: '#993556' },
  accepted: { label: '수락됨', bg: '#EAF3DE', fg: '#3B6D11' },
  cancel_requested: { label: '취소 대기', bg: '#FAEEDA', fg: '#854F0B' },
  completed: { label: '완료', bg: '#F0F5F0', fg: '#5C7A5C' },
  rejected: { label: '반려', bg: '#FBEAF0', fg: '#993556' },
  cancelled: { label: '취소됨', bg: '#F5F0EE', fg: '#9E8880' },
};

function formatDate(d?: string) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${Number(m)}.${Number(day)}`;
}

interface Props {
  segment: RequestSegmentType;
  requests: TodoRequest[];
  bulkMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onItemClick: (id: string) => void;
  nameOf: (email: string) => string;
  myEmail: string;
  /** bulk 체크 가능 여부 — false면 체크박스 disabled. mixed selection (in_progress accepted vs cancel_requested 등) 차단용. */
  isSelectable?: (req: TodoRequest) => boolean;
  /** admin showAll 모니터링 시 fromEmail + toEmail 둘 다 표시. */
  showAdminTarget?: boolean;
}

export default function RequestList({
  segment,
  requests,
  bulkMode,
  selectedIds,
  onToggleSelect,
  onItemClick,
  nameOf,
  myEmail,
  isSelectable,
  showAdminTarget,
}: Props) {
  if (requests.length === 0) {
    return (
      <div className="border border-[#EDE5DC] bg-white rounded p-8 text-center">
        <p className="text-xs text-[#9E8880]">요청이 없습니다.</p>
      </div>
    );
  }

  const counterpartFor = (req: TodoRequest): { label: string; email: string } => {
    if (segment === 'sent') return { label: `To ${nameOf(req.toEmail)}`, email: req.toEmail };
    if (req.toEmail === myEmail) return { label: `From ${nameOf(req.fromEmail)}`, email: req.fromEmail };
    return { label: `To ${nameOf(req.toEmail)}`, email: req.toEmail };
  };

  return (
    <div className="flex flex-col gap-2">
      {requests.map((req) => {
        const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
        const cp = counterpartFor(req);
        const isSelected = selectedIds.has(req.id);
        const dim = segment === 'done';
        const selectable = !isSelectable || isSelectable(req);
        const onRowClick = () => {
          if (bulkMode) {
            if (selectable) onToggleSelect(req.id);
          } else {
            onItemClick(req.id);
          }
        };

        return (
          <div
            key={req.id}
            className="flex items-center bg-white border border-[#EDE5DC] rounded transition-colors"
            style={{
              opacity: dim && !isSelected ? 0.65 : (bulkMode && !selectable ? 0.5 : 1),
              borderLeft: '2px solid #993556',
              cursor: bulkMode && !selectable ? 'default' : 'pointer',
            }}
            onClick={onRowClick}
            onMouseEnter={(e) => { if (!(bulkMode && !selectable)) e.currentTarget.style.background = '#FDF8F4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
          >
            {bulkMode && (
              <div className="pl-3 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => { if (selectable) onToggleSelect(req.id); }}
                  onClick={(e) => e.stopPropagation()}
                  disabled={!selectable}
                  data-testid={`request-bulk-check-${req.id}`}
                  style={{ cursor: selectable ? 'pointer' : 'not-allowed' }}
                />
              </div>
            )}
            <div className="flex-1 px-4 py-3 min-w-0">
              <div className="text-sm text-[#2C1810] font-medium truncate">{req.title}</div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className="text-[10px] px-2 py-0.5 rounded"
                  style={{ background: '#FCEEE9', color: '#A0503A' }}
                >
                  {cp.label}
                </span>
                {showAdminTarget && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded"
                    style={{ background: '#F5F0EE', color: '#9E8880' }}
                  >
                    → {nameOf(req.toEmail)}
                  </span>
                )}
                {req.teamLabel && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded"
                    style={{ background: '#F5F0EE', color: '#9E8880' }}
                  >
                    TEAM
                  </span>
                )}
                {req.dueDate && (
                  <span className="text-[10px] text-[#993556]">⏱ {formatDate(req.dueDate)}</span>
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
  );
}
