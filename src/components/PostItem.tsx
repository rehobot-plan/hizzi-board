'use client';

import { useState } from 'react';
import { Post, usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { useSwipeToDelete } from '@/hooks/useSwipeToDelete';
import PostEditModal from '@/components/PostEditModal';
import ImageViewer from '@/components/common/ImageViewer';

interface PostItemProps {
  post: Post;
}

export default function PostItem({ post }: PostItemProps) {
  const { user } = useAuthStore();
  const { deletePost, updatePost, restorePost } = usePostStore();
  const { addToast } = useToastStore();

  const canEdit = !!(user && (user.email === post.author || user.role === 'admin'));

  const [isHovered, setIsHovered] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);

  const getLeftBorderColor = () => {
    if (post.taskType === 'personal') return '#7B5EA7';
    return '#C17B6B';
  };

  const formatDate = (date: Date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
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
      addToast({ message: '저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!canEdit) return;
    try {
      await deletePost(post.id);
      addToast({
        message: '삭제됨',
        action: {
          label: '실행 취소',
          onClick: async () => { await restorePost(post.id); },
        },
        durationMs: 5000,
      });
    } catch (e) {
      console.error(e);
      addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    }
  };

  const { translateX, isSwiping, handlers } = useSwipeToDelete({
    onThresholdReached: handleDelete,
    disabled: !canEdit,
  });

  const visLabel = !post.visibleTo || post.visibleTo.length === 0 ? '전체'
    : post.visibleTo.length === 1 && post.visibleTo[0] === post.author ? '나만' : '특정';
  const visColor = visLabel === '전체' ? '#639922' : visLabel === '나만' ? '#378ADD' : '#BA7517';

  const renderAttachment = () => {
    if (!post.attachment) return null;
    const { type, url, name } = post.attachment;

    if (type === 'image') {
      return (
        <div style={{ marginTop: 8 }}>
          <img
            src={url}
            alt="첨부 이미지"
            style={{ maxWidth: '100%', height: 'auto', cursor: 'pointer', display: 'block' }}
            onClick={e => { e.stopPropagation(); setIsImageOpen(true); }}
          />
        </div>
      );
    }

    if (type === 'file') {
      return (
        <div style={{ marginTop: 8 }}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 12, color: '#C17B6B', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 1h6l3 3v9H3V1z" stroke="#C17B6B" strokeWidth="1.2" />
              <path d="M8 1v3h3" stroke="#C17B6B" strokeWidth="1.2" />
            </svg>
            {name || url.split('/').pop()?.split('?')[0] || '파일'}
          </a>
        </div>
      );
    }

    if (type === 'link') {
      return (
        <div style={{ marginTop: 8 }}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 12, color: '#C17B6B', wordBreak: 'break-all' }}
          >
            {url}
          </a>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div
        style={{
          position: 'relative', overflow: 'hidden', margin: '0 -20px',
          borderBottom: '1px solid #EDE5DC',
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
        onClick={canEdit ? () => setIsEditOpen(true) : undefined}
        style={{
          position: 'relative',
          padding: '10px 20px 10px 28px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          background: isHovered ? '#FDF8F4' : '#fff',
          transform: `translateX(${translateX}px)`,
          transition: isSwiping
            ? 'background 0.15s ease'
            : 'transform 0.15s ease, background 0.15s ease',
          cursor: canEdit ? 'pointer' : 'default',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: getLeftBorderColor(), pointerEvents: 'none' }} />

        {canEdit && (
          <button
            onClick={e => { e.stopPropagation(); handleStar(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', opacity: post.starred ? 1 : 0.25, transition: 'opacity 0.15s ease', position: 'relative', zIndex: 2 }}
            onMouseEnter={e => { if (!post.starred) e.currentTarget.style.opacity = '0.6'; }}
            onMouseLeave={e => { if (!post.starred) e.currentTarget.style.opacity = '0.25'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L7 1z" stroke="#C17B6B" strokeWidth="1.2" fill={post.starred ? '#C17B6B' : 'none'} />
            </svg>
          </button>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, color: '#2C1810', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', paddingRight: canEdit ? 20 : 0 }}>
            {post.content}
          </p>
          {renderAttachment()}
          <div style={{ marginTop: 4, display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
            {post.taskType && (
              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 3, background: post.taskType === 'personal' ? '#F0ECF5' : '#FFF5F2', color: post.taskType === 'personal' ? '#7B5EA7' : '#C17B6B', border: `1px solid ${post.taskType === 'personal' ? '#7B5EA7' : '#C17B6B'}` }}>
                {post.taskType === 'work' ? '업무' : '개인'}
              </span>
            )}
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 3, color: visColor, border: `1px solid ${visColor}`, background: 'none' }}>
              {visLabel}
            </span>
            <span style={{ fontSize: 9, color: '#C4B8B0', marginLeft: 'auto' }}>{formatDate(post.createdAt)}</span>
          </div>
        </div>

      </div>
      </div>

      {isEditOpen && (
        <PostEditModal
          post={post}
          onClose={() => setIsEditOpen(false)}
        />
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
