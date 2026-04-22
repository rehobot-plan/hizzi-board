'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Post, usePostStore } from '@/store/postStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { useSwipeToDelete } from '@/hooks/useSwipeToDelete';
import ImageViewer from '@/components/common/ImageViewer';
import TodoDetailModal from '@/components/todo/TodoDetailModal';
import RequestDetailPopup from '@/components/request/RequestDetailPopup';
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
  const { updatePost, deletePost, restorePost } = usePostStore();
  const { completeRequest, cancelRequest, reactivateRequest, requests } = useTodoRequestStore();
  const { users } = useUserStore();
  const currentUser = useAuthStore(s => s.user);

  const matchedRequest = post.requestId ? requests.find(r => r.id === post.requestId) ?? null : null;
  const nonAdminUsers = users.filter(u => u.role !== 'admin' && u.email !== post.author);

  const actor = useMemo(() => ({
    email: currentUser?.email || '',
    name: currentUser?.displayName || currentUser?.email?.split('@')[0] || '',
  }), [currentUser]);

  const [checking, setChecking] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTeamTooltip, setShowTeamTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [showSpecificTooltip, setShowSpecificTooltip] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
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
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isImageOpen]);

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
    const requestId = post.requestId;
    setTimeout(async () => {
      try {
        await updatePost(post.id, { completed: true, completedAt: new Date() });
        if (requestId) await completeRequest(requestId, actor);
        useToastStore.getState().addToast({
          message: '완료됨',
          action: {
            label: '되돌리기',
            onClick: async () => {
              await usePostStore.getState().uncompletePost(post.id);
              if (requestId) await reactivateRequest(requestId, actor);
            },
          },
          durationMs: 5000,
        });
      } catch (e) {
        console.error(e);
        useToastStore.getState().addToast({ message: '완료 처리에 실패했습니다. 다시 시도해주세요.', type: 'error' });
      } finally {
        setChecking(false);
      }
    }, 600);
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
    const requestId = post.requestId;
    try {
      await deletePost(post.id);
      if (requestId) {
        await cancelRequest(requestId, actor);
      }
      useToastStore.getState().addToast({
        message: '삭제됨',
        action: {
          label: '실행 취소',
          onClick: async () => {
            await restorePost(post.id);
            if (requestId) await reactivateRequest(requestId, actor);
          },
        },
        durationMs: 5000,
      });
    } catch (e) {
      console.error(e);
      useToastStore.getState().addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    }
  };

  const { translateX, isSwiping, handlers } = useSwipeToDelete({
    onThresholdReached: handleDelete,
    disabled: !canEdit || justChecked,
  });

  const handleItemClick = () => {
    if (!canEdit || justChecked) return;
    if (post.requestId) {
      if (matchedRequest) {
        setShowOrderModal(true);
      } else {
        setShowDetailModal(true); // fallback: 요청 문서 부재 시 일반 모달
      }
    } else {
      setShowDetailModal(true);
    }
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
        style={{
          position: 'relative', overflow: 'hidden', margin: '0 -20px',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {(isSwiping || translateX < 0) && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              paddingRight: 24,
              background: '#FBEAF0', color: '#993556',
              fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
              pointerEvents: 'none',
            }}
          >
            삭제
          </div>
        )}
      <div
        {...handlers}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleItemClick}
        style={{
          cursor: canEdit && !justChecked ? 'pointer' : 'default',
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '10px 20px 10px 28px',
          position: 'relative',
          opacity: justChecked ? 0.4 : 1,
          transform: justChecked ? 'translateX(8px)' : `translateX(${translateX}px)`,
          transition: isSwiping
            ? 'opacity 0.5s ease, background 0.15s ease'
            : 'opacity 0.5s ease, transform 0.15s ease, background 0.15s ease',
          background: isHovered && !justChecked ? colors.mainBg : colors.cardBg,
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: todoLeftBorderColor(post), pointerEvents: 'none' }} />

        {canEdit && isHovered && !justChecked && !isSwiping && (
          <button
            onClick={e => { e.stopPropagation(); handleDelete(); }}
            title="삭제"
            style={{
              position: 'absolute', top: 8, right: 8, zIndex: 3,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, opacity: 0.25, transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.25')}
          >
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2.5 3.5h7M5 5.5v3.5M7 5.5v3.5M3.5 3.5l.5 6h4l.5-6M4.5 3.5v-1.2h3v1.2" stroke="#9E8880" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {canEdit && (
          <button onClick={e => { e.stopPropagation(); handleCheck(); }} disabled={checking || justChecked}
            style={{ width: 18, height: 18, border: `1.5px solid ${justChecked ? colors.accent : colors.border}`, background: justChecked ? colors.accent : colors.cardBg, cursor: justChecked ? 'default' : 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', position: 'relative', zIndex: 2 }}>
            {justChecked && <CheckIcon />}
            <span aria-hidden="true" style={{ position: 'absolute', inset: '-13px -4px -13px -14px' }} />
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
      </div>

      <TodoDetailModal
        post={post}
        canEdit={canEdit}
        isOpen={showDetailModal && !post.requestId}
        onClose={() => setShowDetailModal(false)}
      />

      <RequestDetailPopup
        request={matchedRequest}
        isOpen={showOrderModal && !!matchedRequest}
        onClose={() => setShowOrderModal(false)}
      />

      {isImageOpen && post.attachment?.type === 'image' && (
        <ImageViewer
          url={post.attachment.url}
          onClose={() => setIsImageOpen(false)}
        />
      )}

    </>
  );
}
