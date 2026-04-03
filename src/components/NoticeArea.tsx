'use client';

import { useState } from 'react';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { usePanelStore } from '@/store/panelStore';
import { useUserStore } from '@/store/userStore';

const PinIcon = ({ filled }: { filled: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M8 1L11 4L7.5 5.5L6 11L4.5 7.5L1 6L6.5 4.5L8 1Z"
      stroke="#C17B6B" strokeWidth="1.2"
      fill={filled ? '#C17B6B' : 'none'} />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M2 6.5l3-3 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

export default function NoticeArea() {
  const { posts } = usePostStore();
  const { user } = useAuthStore();
  const { panels } = usePanelStore();
  const { users } = useUserStore();
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const allNotices = posts
    .filter(p => {
      if (p.category !== '공지') return false;
      if (!user) return false;
      const v = p.visibleTo;
      if (!v || v.length === 0) return true;
      if (user.role === 'admin') return true;
      if (p.author === user.email) return true;
      return v.includes(user.email ?? '');
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const notices = allNotices.slice(0, expanded ? 20 : 3);

  const getAuthorName = (email: string) => {
    const u = users.find(u => u.email === email);
    return u?.name || email?.split('@')[0] || email;
  };

  const formatDate = (date: Date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handlePin = async (id: string, pinned: boolean) => {
    await usePostStore.getState().updatePost(id, { pinned: !pinned });
  };

  if (allNotices.length === 0) return null;

  const detailNotice = detail ? allNotices.find(n => n.id === detail) : null;

  return (
    <>
      <div style={{ background: '#fff', border: '1px solid #EDE5DC', marginTop: 24, marginBottom: 16 }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #EDE5DC', background: '#7A2828' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#FDF8F4' }}>공지사항</span>
          {allNotices.length > 3 && (
            <button onClick={() => setExpanded(e => !e)}
              style={{ fontSize: 10, color: 'rgba(253,248,244,0.6)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
              {expanded ? <><ChevronUpIcon /> 접기</> : <><ChevronDownIcon /> 더보기 ({allNotices.length - 3}개 더)</>}
            </button>
          )}
        </div>

        {/* 목록 */}
        {notices.map((notice, idx) => {
          const panel = panels.find(p => p.id === notice.panelId);
          const panelName = panel?.name || notice.panelId;
          const contentPreview = (notice.content || '').replace(/\n/g, ' ').slice(0, 80);

          return (
            <div key={notice.id} style={{ position: 'relative' }}>
              {/* 레이어 1: hover 배경 */}
              <div style={{
                position: 'absolute', inset: 0,
                borderBottom: idx < notices.length - 1 ? '1px solid #EDE5DC' : 'none',
                pointerEvents: 'none',
              }} />

              <div
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: idx < notices.length - 1 ? '1px solid #EDE5DC' : 'none', cursor: 'pointer', transition: 'background 0.15s ease' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FDF8F4')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => setDetail(notice.id)}
              >
                {/* 핀 고정 표시 */}
                {notice.pinned && (
                  <span style={{ flexShrink: 0 }}><PinIcon filled={true} /></span>
                )}

                {/* 패널 태그 */}
                <span style={{ fontSize: 9, padding: '1px 6px', flexShrink: 0, background: '#F5E6E0', color: '#7A2828', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {panelName}
                </span>

                {/* 내용 */}
                <span style={{ fontSize: 12, color: '#2C1810', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {contentPreview}
                </span>

                <span style={{ fontSize: 10, color: '#9E8880', flexShrink: 0, whiteSpace: 'nowrap' }}>{getAuthorName(notice.author)}</span>
                <span style={{ fontSize: 10, color: '#C4B8B0', flexShrink: 0, whiteSpace: 'nowrap' }}>{formatDate(notice.createdAt)}</span>

                {/* 관리자 핀/삭제 */}
                {user?.role === 'admin' && (
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => handlePin(notice.id, !!notice.pinned)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', opacity: notice.pinned ? 1 : 0.4, transition: 'opacity 0.15s ease' }}
                      title={notice.pinned ? '핀 해제' : '핀 고정'}>
                      <PinIcon filled={!!notice.pinned} />
                    </button>
                    <button onClick={() => setDeleteConfirmId(notice.id)}
                      style={{ fontSize: 10, color: '#C17B6B', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', transition: 'color 0.15s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#7A2828')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#C17B6B')}>
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 상세 모달 */}
      {detailNotice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setDetail(null)}>
          <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 480, zIndex: 1001 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE5DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>공지사항</span>
              <span style={{ fontSize: 9, padding: '1px 6px', background: '#F5E6E0', color: '#7A2828', letterSpacing: '0.06em' }}>
                {panels.find(p => p.id === detailNotice.panelId)?.name || detailNotice.panelId}
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: 13, color: '#2C1810', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {detailNotice.content}
              </p>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#9E8880' }}>{getAuthorName(detailNotice.author)}</span>
                <span style={{ fontSize: 11, color: '#C4B8B0' }}>{formatDate(detailNotice.createdAt)}</span>
              </div>
              <button onClick={() => setDetail(null)}
                style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setDeleteConfirmId(null)}>
          <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 340, zIndex: 1001 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE5DC' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>공지 삭제</span>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: 13, color: '#2C1810', lineHeight: 1.6 }}>이 공지를 삭제할까요?</p>
              <p style={{ fontSize: 11, color: '#9E8880', marginTop: 4 }}>삭제된 공지는 복구할 수 없습니다.</p>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setDeleteConfirmId(null)}
                style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
              <button onClick={() => {
                  usePostStore.getState().deletePost(deleteConfirmId);
                  setDeleteConfirmId(null);
                  if (detail === deleteConfirmId) setDetail(null);
                }}
                style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: '#C17B6B', color: '#FDF8F4', border: 'none', cursor: 'pointer' }}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
