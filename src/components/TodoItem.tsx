'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Post, usePostStore } from '@/store/postStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import { useUserStore } from '@/store/userStore';
import ImageViewer from '@/components/common/ImageViewer';
import TodoDetailModal from '@/components/todo/TodoDetailModal';
import { colors, tagColors } from '@/styles/tokens';
import { todoLeftBorderColor } from '@/lib/leftBorderColor';

interface TodoItemProps {
  post: Post;
  canEdit: boolean;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L7 1z"
      stroke="#C17B6B" strokeWidth="1.2" fill={filled ? '#C17B6B' : 'none'} />
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function TodoItem({ post, canEdit }: TodoItemProps) {
  const { updatePost, deletePost } = usePostStore();
  const { completeRequest } = useTodoRequestStore();
  const { users } = useUserStore();
  const nonAdminUsers = users.filter(u => u.role !== 'admin' && u.email !== post.author);

  const [checking, setChecking] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTeamTooltip, setShowTeamTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [showSpecificTooltip, setShowSpecificTooltip] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - dragPos.x, y: e.clientY - dragPos.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isImageOpen) { setIsImageOpen(false); return; }
      if (showOrderModal) { setShowOrderModal(false); return; }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isImageOpen, showOrderModal]);

  const isWork = post.taskType === 'work';
  const tagLabel = isWork ? '업무' : '개인';

  const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const handleCheck = async () => {
    if (!canEdit || checking || justChecked) return;
    setJustChecked(true);
    setChecking(true);
    setTimeout(async () => {
      try {
        await updatePost(post.id, { completed: true, completedAt: new Date() });
        if (post.requestId) await completeRequest(post.requestId);
      } catch (e) {
        console.error(e);
        const { useToastStore } = await import('@/store/toastStore');
        useToastStore.getState().addToast({ message: '완료 처리에 실패했습니다. 다시 시도해주세요.', type: 'error' });
      } finally {
        setChecking(false);
      }
    }, 600);
  };

  const handleComplete = async () => {
    if (!canEdit || isCompleting) return;
    setIsCompleting(true);
    try {
      await updatePost(post.id, { completed: true, completedAt: new Date() });
      if (post.requestId) await completeRequest(post.requestId);
      setShowOrderModal(false);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleStar = async () => {
    if (!canEdit) return;
    try {
      await updatePost(post.id, {
        starred: !post.starred,
        starredAt: post.starred ? null : new Date(),
      });
    } catch (e) {
      console.error(e);
      const { useToastStore } = await import('@/store/toastStore');
      useToastStore.getState().addToast({ message: '저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!canEdit) return;
    try {
      await deletePost(post.id);
    } catch (e) {
      console.error(e);
      const { useToastStore } = await import('@/store/toastStore');
      useToastStore.getState().addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    }
  };

  const handleItemClick = () => {
    if (!canEdit || justChecked) return;
    if (post.requestId) setShowOrderModal(true);
    else setShowDetailModal(true);
  };

  const renderContent = () => {
    if (post.attachment?.type === 'image') return (
      <>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: justChecked ? colors.textSecondary : colors.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 6 }}>{post.content}</div>
        <img
          src={post.attachment.url}
          alt="할일 이미지"
          style={{ maxWidth: '100%', height: 'auto', display: 'block', opacity: justChecked ? 0.5 : 1 }}
          onClick={e => { e.stopPropagation(); setIsImageOpen(true); }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </>
    );
    if (post.attachment?.type === 'file') return (
      <a
        href={post.attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{ fontSize: 12, color: colors.accent, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M3 1h6l3 3v9H3V1z" stroke="#C17B6B" strokeWidth="1.2"/>
          <path d="M8 1v3h3" stroke="#C17B6B" strokeWidth="1.2"/>
        </svg>
        {post.attachment.name || post.attachment.url.split('/').pop()?.split('?')[0] || '첨부파일'}
      </a>
    );
    if (post.attachment?.type === 'link') return (
      <a
        href={post.attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{ fontSize: 12, color: colors.accent, wordBreak: 'break-all' }}
      >
        {post.attachment.url}
      </a>
    );
    return post.content;
  };

  const normalizeDueDate = (s: string) =>
    s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s;

  const renderDueTag = (dueDateStr: string) => {
    const due = new Date(normalizeDueDate(dueDateStr) + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isUrgent = diffDays <= 3;
    const dueColor = isUrgent ? tagColors.dueSoon.fg : tagColors.dueLater.fg;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 8, padding: '2px 6px', background: isUrgent ? tagColors.dueSoon.bg : tagColors.dueLater.bg, color: dueColor, border: `1px solid ${dueColor}` }}>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke={dueColor} strokeWidth="1.2"/>
          <path d="M5 3v2.2l1.4 1" stroke={dueColor} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        {due.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
      </span>
    );
  };

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleItemClick}
        style={{
          cursor: canEdit && !justChecked ? 'pointer' : 'default',
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '10px 20px 10px 28px', margin: '0 -20px',
          borderBottom: `1px solid ${colors.border}`, position: 'relative',
          opacity: justChecked ? 0.4 : 1,
          transition: 'opacity 0.5s ease, transform 0.5s ease, background 0.15s ease',
          transform: justChecked ? 'translateX(8px)' : 'translateX(0)',
          background: isHovered && !justChecked ? colors.mainBg : colors.cardBg,
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: todoLeftBorderColor(post), pointerEvents: 'none' }} />

        {canEdit && (
          <button onClick={e => { e.stopPropagation(); handleCheck(); }} disabled={checking || justChecked}
            style={{ width: 16, height: 16, border: `1.5px solid ${justChecked ? colors.accent : colors.border}`, background: justChecked ? colors.accent : colors.cardBg, cursor: justChecked ? 'default' : 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', position: 'relative', zIndex: 2 }}>
            {justChecked && <CheckIcon />}
          </button>
        )}

        {canEdit && (
          <button onClick={e => { e.stopPropagation(); handleStar(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', transition: 'opacity 0.15s ease', opacity: post.starred ? 1 : 0.25, position: 'relative', zIndex: 2 }}
            onMouseEnter={e => { if (!post.starred) e.currentTarget.style.opacity = '0.6'; }}
            onMouseLeave={e => { if (!post.starred) e.currentTarget.style.opacity = '0.25'; }}>
            <StarIcon filled={!!post.starred} />
          </button>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, lineHeight: 1.5, textDecoration: justChecked ? 'line-through' : 'none', color: justChecked ? colors.textSecondary : colors.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-word', transition: 'all 0.15s ease' }}>
                {renderContent()}
              </div>
              {post.requestFrom && post.requestContent && (
                <div style={{ fontSize: 11, color: colors.textHint, marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.requestContent}</div>
              )}
            </div>
            {canEdit && !post.requestId && !justChecked && (
              <span onClick={e => { e.stopPropagation(); handleDelete(); }}
                style={{ cursor: 'pointer', flexShrink: 0, opacity: 0.2, transition: 'opacity 0.15s', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', marginTop: 2 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.2')}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M5 4V2.5h4V4M5.5 6v5M8.5 6v5M3 4l.7 7.5h6.6L11 4" stroke="#C17B6B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            {post.requestFrom ? (
              <span style={{ fontSize: 9, padding: '2px 7px', background: tagColors.category.request.bg, color: tagColors.category.request.fg, border: `1px solid ${tagColors.category.request.border}`, letterSpacing: '0.04em' }}>요청</span>
            ) : (
              <span style={{ fontSize: 9, padding: '2px 7px', background: post.taskType === 'personal' ? tagColors.category.personal.bg : tagColors.category.work.bg, color: post.taskType === 'personal' ? tagColors.category.personal.fg : tagColors.category.work.fg, border: `1px solid ${post.taskType === 'personal' ? tagColors.category.personal.fg : tagColors.category.work.fg}`, letterSpacing: '0.04em' }}>{tagLabel}</span>
            )}
            {!post.requestFrom && (() => {
              const v = post.visibleTo;
              const isAll = !v || v.length === 0;
              const isSpec = v && v.length > 1;
              const label = isAll ? '전체' : isSpec ? '특정' : '나만';
              const color = isAll ? tagColors.visibility.all.fg : isSpec ? tagColors.visibility.specific.fg : tagColors.visibility.meOnly.fg;
              const border = isAll ? `1px solid ${tagColors.visibility.all.border}` : isSpec ? `1px solid ${tagColors.visibility.specific.border}` : `1px solid ${tagColors.visibility.meOnly.border}`;
              return (
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  <span style={{ fontSize: 9, padding: '1px 6px', background: 'none', color, border, letterSpacing: '0.06em' }}
                    onMouseEnter={() => setShowSpecificTooltip(true)}
                    onMouseLeave={() => setShowSpecificTooltip(false)}>
                    {label}
                  </span>
                  {label === '특정' && showSpecificTooltip && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: colors.cardBg, border: `0.5px solid ${colors.border}`, padding: '6px 8px', zIndex: 50, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 240 }}>
                        {post.visibleTo.map(email => {
                          const u = users.find(u => u.email === email);
                          return <span key={email} style={{ fontSize: 9, padding: '2px 7px', background: tagColors.team.bg, color: colors.textSecondary, letterSpacing: '0.04em' }}>{u?.name || email.split('@')[0]}</span>;
                        })}
                      </div>
                    </div>
                  )}
                </span>
              );
            })()}
            {post.requestFrom && (
              <>
                <span style={{ fontSize: 9, padding: '2px 7px', background: tagColors.from.bg, color: tagColors.from.fg, letterSpacing: '0.04em' }}>
                  From {users.find(u => u.email === post.requestFrom)?.name || post.requestFrom?.split('@')[0]}
                </span>
                {post.visibleTo && post.visibleTo.length > 1 && (
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                    onMouseEnter={e => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setTooltipPos({ top: rect.bottom + 6, left: rect.left }); setShowTeamTooltip(true); }}
                    onMouseLeave={() => setShowTeamTooltip(false)}>
                    <span style={{ fontSize: 9, padding: '2px 7px', background: tagColors.team.bg, color: colors.textSecondary, letterSpacing: '0.04em', cursor: 'default' }}>TEAM</span>
                    {showTeamTooltip && typeof window !== 'undefined' && createPortal(
                      <div style={{ position: 'fixed', top: tooltipPos.top, left: tooltipPos.left, background: colors.cardBg, border: `0.5px solid ${colors.border}`, padding: '8px', zIndex: 9999, boxShadow: '0 4px 12px rgba(44,20,16,0.08)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 4 }}>
                          {post.visibleTo.map(email => {
                            const u = users.find(u => u.email === email);
                            return <span key={email} style={{ fontSize: 9, padding: '3px 8px', background: tagColors.team.bg, color: colors.textSecondary, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{u?.name || email.split('@')[0]}</span>;
                          })}
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                )}
              </>
            )}
            {(post.requestDueDate || post.dueDate) && renderDueTag(post.requestDueDate || post.dueDate!)}
            <span style={{ fontSize: 9, color: colors.textHint, marginLeft: 'auto' }}>{formatDate(post.createdAt)}</span>
            {justChecked && <span style={{ fontSize: 10, color: colors.accent, letterSpacing: '0.04em' }}>완료</span>}
          </div>
        </div>
      </div>

      <TodoDetailModal
        post={post}
        canEdit={canEdit}
        isOpen={showDetailModal && !post.requestId}
        onClose={() => setShowDetailModal(false)}
      />

      {showOrderModal && post.requestId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowOrderModal(false)}>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, width: '100%', maxWidth: 860, zIndex: 1001, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: colors.sidebarBg, padding: '20px 28px', flexShrink: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.mainBg, lineHeight: 1.4, marginBottom: 12 }}>{post.content}</div>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                {post.requestFrom && (
                  <div style={{ fontSize: 12, color: 'rgba(253,248,244,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="3" r="2" stroke="rgba(253,248,244,0.7)" strokeWidth="1.2"/><path d="M1 9c0-2 1.8-3 4-3s4 1 4 3" stroke="rgba(253,248,244,0.7)" strokeWidth="1.2"/></svg>
                    {users.find(u => u.email === post.requestFrom)?.name || post.requestFrom.split('@')[0]} → 나
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'rgba(253,248,244,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><rect x="1" y="1.5" width="8" height="7" rx="1" stroke="rgba(253,248,244,0.7)" strokeWidth="1.2"/><path d="M3 1v1.5M7 1v1.5M1 4h8" stroke="rgba(253,248,244,0.7)" strokeWidth="1.2"/></svg>
                  {formatDate(post.createdAt)} 등록
                </div>
                {(post.requestDueDate || post.dueDate) && (() => {
                  const dueDateStr = post.requestDueDate || post.dueDate!;
                  return (
                    <div style={{ fontSize: 12, color: tagColors.dueSoonLight, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                      <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#F4C0D1" strokeWidth="1.2"/><path d="M5 3v2.2l1.4 1" stroke="#F4C0D1" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      {new Date(dueDateStr + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} 까지
                    </div>
                  );
                })()}
              </div>
            </div>
            <div style={{ background: tagColors.from.bg, padding: '8px 28px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: tagColors.category.request.fg, display: 'inline-block' }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: tagColors.category.request.fg }}>진행중</span>
            </div>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 360 }}>
              <div style={{ width: 260, flexShrink: 0, borderRight: `1px solid ${colors.border}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
                {post.requestContent && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.textSecondary, marginBottom: 7 }}>상세 내용</div>
                    <div style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.requestContent}</div>
                  </div>
                )}
                <div style={{ height: '0.5px', background: colors.border }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: colors.textSecondary, width: 36, flexShrink: 0 }}>공개</span>
                    <span style={{ fontSize: 9, padding: '3px 8px', color: !post.visibleTo || post.visibleTo.length === 0 ? tagColors.visibility.all.fg : post.visibleTo.length > 1 ? tagColors.visibility.specific.fg : tagColors.visibility.meOnly.fg, border: !post.visibleTo || post.visibleTo.length === 0 ? `1px solid ${tagColors.visibility.all.border}` : post.visibleTo.length > 1 ? `1px solid ${tagColors.visibility.specific.border}` : `1px solid ${tagColors.visibility.meOnly.border}` }}>
                      {!post.visibleTo || post.visibleTo.length === 0 ? '전체' : post.visibleTo.length > 1 ? '특정' : '나만'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: colors.textSecondary, width: 36, flexShrink: 0 }}>구분</span>
                    <span style={{ fontSize: 9, padding: '3px 8px', background: post.taskType === 'personal' ? tagColors.category.personal.bg : tagColors.category.work.bg, color: post.taskType === 'personal' ? tagColors.category.personal.fg : tagColors.category.work.fg, border: `1px solid ${post.taskType === 'personal' ? tagColors.category.personal.fg : tagColors.category.work.fg}` }}>
                      {post.taskType === 'personal' ? '개인' : '업무'}
                    </span>
                  </div>
                </div>
                <div style={{ height: '0.5px', background: colors.border }} />
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.textSecondary, marginBottom: 7 }}>첨부파일</div>
                  {post.attachment ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: `0.5px solid ${colors.border}`, background: colors.cardBg }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1h6l3 3v9H3V1z" stroke="#C17B6B" strokeWidth="1.2"/><path d="M8 1v3h3" stroke="#C17B6B" strokeWidth="1.2"/></svg>
                        <span style={{ fontSize: 12, color: colors.textPrimary }}>{post.attachment.name || '첨부파일'}</span>
                      </div>
                      <a href={post.attachment.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: colors.accent, textDecoration: 'none' }}>열기</a>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: colors.textHint }}>없음</div>
                  )}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ textAlign: 'center', fontSize: 10, color: colors.textHint }}>댓글 기능은 준비 중입니다</div>
                </div>
                <div style={{ borderTop: `1px solid ${colors.border}`, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                  <input placeholder="메모를 남겨주세요..." disabled
                    style={{ flex: 1, border: 'none', borderBottom: `1px solid ${colors.border}`, fontSize: 12, color: colors.textPrimary, outline: 'none', background: 'transparent', padding: '5px 0', fontFamily: 'inherit', opacity: 0.4, cursor: 'not-allowed' }} />
                  <button disabled style={{ fontSize: 10, padding: '7px 16px', background: colors.border, color: colors.textSecondary, border: 'none', cursor: 'not-allowed' }}>전송</button>
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 28px', borderTop: `1px solid ${colors.border}`, background: colors.mainBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <button onClick={() => setShowOrderModal(false)} style={{ fontSize: 11, letterSpacing: '0.04em', color: colors.textSecondary, background: 'none', border: 'none', cursor: 'pointer' }}>닫기</button>
              <button onClick={handleComplete} disabled={isCompleting}
                style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '9px 24px', background: colors.textPrimary, color: colors.mainBg, border: 'none', cursor: isCompleting ? 'not-allowed' : 'pointer', opacity: isCompleting ? 0.6 : 1 }}>
                {isCompleting ? '처리 중...' : '완료 처리'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isImageOpen && post.attachment?.type === 'image' && (
        <ImageViewer
          url={post.attachment.url}
          onClose={() => setIsImageOpen(false)}
        />
      )}

    </>
  );
}
