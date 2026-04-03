'use client';

import { useState } from 'react';
import { useTodoRequestStore, TodoRequest } from '@/store/todoRequestStore';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { usePanelStore } from '@/store/panelStore';

interface Props {
  onClose: () => void;
}

type TabType = 'received' | 'sent' | 'inprogress' | 'done';

export default function TodoRequestModal({ onClose }: Props) {
  const { user } = useAuthStore();
  const { users } = useUserStore();
  const { panels } = usePanelStore();
  const { requests, acceptRequest, rejectRequest, cancelRequest } = useTodoRequestStore();
  const { addPost } = usePostStore();

  const [tab, setTab] = useState<TabType>('received');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [accepting, setAccepting] = useState<string | null>(null);

  const myEmail = user?.email ?? '';
  const myName = users.find(u => u.email === myEmail)?.name || myEmail;
  const isAdmin = user?.role === 'admin';

  // 탭별 필터링
  const allMine = isAdmin
    ? requests
    : requests.filter(r => r.fromEmail === myEmail || r.toEmail === myEmail);

  const receivedList = allMine.filter(r =>
    r.status === 'pending' && (isAdmin ? true : r.toEmail === myEmail)
  );
  const sentList = allMine.filter(r =>
    r.status === 'pending' && r.fromEmail === myEmail && (isAdmin ? false : r.toEmail !== myEmail)
  );
  const inprogressList = allMine.filter(r => r.status === 'accepted');
  const doneList = allMine.filter(r =>
    r.status === 'rejected' || r.status === 'cancelled'
  );

  const pendingCount = receivedList.length;

  const getUser = (email: string) => users.find(u => u.email === email);

  const formatDate = (d: Date) => {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDueDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  };

  const handleAccept = async (req: TodoRequest) => {
    setAccepting(req.id);
    await acceptRequest(req.id, addPost, myName);
    setAccepting(null);
  };

  const handleReject = async () => {
    if (!rejectId) return;
    await rejectRequest(rejectId, rejectReason);
    setRejectId(null);
    setRejectReason('');
  };

  const tabStyle = (t: TabType) => ({
    padding: '6px 10px',
    fontSize: 10,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    background: 'none',
    border: 'none',
    borderBottom: tab === t ? '2px solid #C17B6B' : '2px solid transparent',
    color: tab === t ? '#C17B6B' : '#9E8880',
    cursor: 'pointer',
    marginBottom: -1,
    whiteSpace: 'nowrap' as const,
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { text: string; color: string; bg: string }> = {
      pending:   { text: '대기중', color: '#C17B6B', bg: '#FFF5F2' },
      accepted:  { text: '진행중', color: '#5C7A5C', bg: '#F0F5F0' },
      rejected:  { text: '반려됨', color: '#9E8880', bg: '#F5F0EE' },
      cancelled: { text: '취소됨', color: '#C4B8B0', bg: '#F8F6F4' },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ fontSize: 9, padding: '2px 6px', background: s.bg, color: s.color, letterSpacing: '0.06em' }}>
        {s.text}
      </span>
    );
  };

  const RequestCard = ({ r, mode }: { r: TodoRequest; mode: 'received' | 'sent' | 'inprogress' | 'done' }) => (
    <div style={{ padding: '14px 0', borderBottom: '1px solid #EDE5DC', opacity: mode === 'done' ? 0.65 : 1 }}>

      {/* 상단: 발신/수신 + 날짜 + 상태 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#2C1810' }}>
            {mode === 'received'
              ? getUser(r.fromEmail)?.name || r.fromEmail
              : `→ ${getUser(r.toEmail)?.name || r.toEmail}`}
          </span>
          <span style={{ fontSize: 10, color: '#C4B8B0', marginLeft: 8 }}>{formatDate(r.createdAt)}</span>
        </div>
        {statusBadge(r.status)}
      </div>

      {/* 제목 */}
      <p style={{ fontSize: 13, color: '#2C1810', fontWeight: 600, marginBottom: 4,
        textDecoration: mode === 'done' ? 'line-through' : 'none' }}>
        {r.title}
      </p>

      {/* 팀 표시 */}
      {r.teamLabel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
          <span style={{ fontSize: 9, padding: '1px 6px', background: '#F5F0EE', color: '#9E8880', letterSpacing: '0.06em' }}>TEAM</span>
          <span style={{ fontSize: 11, color: '#9E8880' }}>{r.teamLabel}</span>
        </div>
      )}

      {/* 내용 */}
      {r.content && (
        <p style={{ fontSize: 12, color: '#9E8880', marginBottom: 6, lineHeight: 1.5 }}>{r.content}</p>
      )}

      {/* 기한 */}
      {r.dueDate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="2" width="12" height="11" rx="1" stroke="#C17B6B" strokeWidth="1.2"/>
            <path d="M4 1v2M10 1v2M1 5h12" stroke="#C17B6B" strokeWidth="1.2"/>
          </svg>
          <span style={{ fontSize: 11, color: '#C17B6B' }}>기한 {formatDueDate(r.dueDate)}</span>
          {mode === 'received' && (
            <span style={{ fontSize: 10, color: '#C4B8B0' }}>· 수락 시 달력 자동 등록</span>
          )}
        </div>
      )}

      {/* 반려 사유 */}
      {r.status === 'rejected' && r.rejectReason && (
        <p style={{ fontSize: 11, color: '#C17B6B', marginBottom: 6 }}>반려 사유: {r.rejectReason}</p>
      )}

      {/* 수락/반려 버튼 */}
      {mode === 'received' && (
        <div style={{ marginTop: 10 }}>
          {rejectId !== r.id ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => handleAccept(r)} disabled={accepting === r.id}
                style={{ padding: '6px 16px', fontSize: 10, background: '#2C1810', color: '#FDF8F4', border: 'none', cursor: accepting === r.id ? 'not-allowed' : 'pointer', opacity: accepting === r.id ? 0.6 : 1 }}>
                {accepting === r.id ? '수락 중...' : '수락'}
              </button>
              <button onClick={() => { setRejectId(r.id); setRejectReason(''); }}
                style={{ padding: '6px 16px', fontSize: 10, background: 'none', color: '#C17B6B', border: '1px solid #C17B6B', cursor: 'pointer' }}>
                반려
              </button>
            </div>
          ) : (
            <div>
              <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="반려 사유 입력..."
                style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleReject}
                  style={{ padding: '5px 14px', fontSize: 10, background: '#C17B6B', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  반려 확정
                </button>
                <button onClick={() => setRejectId(null)}
                  style={{ padding: '5px 14px', fontSize: 10, background: 'none', color: '#9E8880', border: 'none', cursor: 'pointer' }}>
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 요청 취소 버튼 (보낸 요청 + pending만) */}
      {mode === 'sent' && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => cancelRequest(r.id)}
            style={{ padding: '5px 14px', fontSize: 10, background: 'none', color: '#9E8880', border: '1px solid #EDE5DC', cursor: 'pointer' }}>
            요청 취소
          </button>
        </div>
      )}
    </div>
  );

  const currentList = () => {
    if (tab === 'received') return receivedList;
    if (tab === 'sent') return sentList;
    if (tab === 'inprogress') return inprogressList;
    return doneList;
  };

  const emptyText: Record<TabType, string> = {
    received: '받은 요청이 없습니다',
    sent: '보낸 요청이 없습니다',
    inprogress: '진행 중인 요청이 없습니다',
    done: '완료된 요청이 없습니다',
  };

  const cardMode = (t: TabType): 'received' | 'sent' | 'inprogress' | 'done' => t;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', zIndex: 1001 }}>

        {/* 헤더 */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE5DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>
            할일 요청함
            {pendingCount > 0 && <span style={{ color: '#C17B6B', marginLeft: 6 }}>({pendingCount})</span>}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E8880', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', borderBottom: '1px solid #EDE5DC', padding: '0 20px' }}>
          <button style={tabStyle('received')} onClick={() => setTab('received')}>
            받은 요청{receivedList.length > 0 ? ` (${receivedList.length})` : ''}
          </button>
          <button style={tabStyle('sent')} onClick={() => setTab('sent')}>
            보낸 요청{sentList.length > 0 ? ` (${sentList.length})` : ''}
          </button>
          <button style={tabStyle('inprogress')} onClick={() => setTab('inprogress')}>
            진행 중{inprogressList.length > 0 ? ` (${inprogressList.length})` : ''}
          </button>
          <button style={tabStyle('done')} onClick={() => setTab('done')}>
            완료{doneList.length > 0 ? ` (${doneList.length})` : ''}
          </button>
        </div>

        {/* 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {currentList().length === 0
            ? <p style={{ fontSize: 12, color: '#C4B8B0', textAlign: 'center', padding: '32px 0' }}>{emptyText[tab]}</p>
            : currentList().map(r => <RequestCard key={r.id} r={r} mode={cardMode(tab)} />)
          }
        </div>
      </div>
    </div>
  );
}
