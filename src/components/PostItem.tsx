'use client';

import { useState } from 'react';
import { Post, usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import PostEditModal from '@/components/PostEditModal';

interface PostItemProps {
  post: Post;
}

export default function PostItem({ post }: PostItemProps) {
  const { user } = useAuthStore();
  const { deletePost, updatePost } = usePostStore();
  const { addToast } = useToastStore();

  const canEdit = !!(user && (user.email === post.author || user.role === 'admin'));

  const [isHovered, setIsHovered] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
    } catch (e) {
      console.error(e);
      addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.min(5, Math.max(0.5, prev - e.deltaY * 0.001)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - dragPos.x, y: e.clientY - dragPos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

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
            onClick={e => { e.stopPropagation(); setIsModalOpen(true); }}
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={canEdit ? () => setIsEditOpen(true) : undefined}
        style={{
          position: 'relative',
          padding: '10px 20px 10px 28px',
          margin: '0 -20px',
          borderBottom: '1px solid #EDE5DC',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          background: isHovered ? '#FDF8F4' : '#fff',
          transition: 'background 0.15s ease',
          cursor: canEdit ? 'pointer' : 'default',
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

        {canEdit && (
          <span
            onClick={e => { e.stopPropagation(); handleDelete(); }}
            style={{ position: 'relative', zIndex: 2, cursor: 'pointer', flexShrink: 0, opacity: 0.2, transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', marginTop: 2 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.2')}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 4h10M5 4V2.5h4V4M5.5 6v5M8.5 6v5M3 4l.7 7.5h6.6L11 4" stroke="#C17B6B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>

      {isEditOpen && (
        <PostEditModal
          post={post}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {isModalOpen && post.attachment?.type === 'image' && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { setIsModalOpen(false); setZoom(1); setDragPos({ x: 0, y: 0 }); }}
        >
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{Math.round(zoom * 100)}%</span>
            <span onClick={e => { e.stopPropagation(); setZoom(1); setDragPos({ x: 0, y: 0 }); }} style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', border: 'none', padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>
              초기화
            </span>
          </div>
          <div style={{ overflow: 'hidden', maxWidth: '90vw', maxHeight: '90vh' }} onWheel={handleWheel} onClick={e => e.stopPropagation()}>
            <img
              src={post.attachment.url}
              alt="확대 이미지"
              style={{ transform: `scale(${zoom}) translate(${dragPos.x / zoom}px, ${dragPos.y / zoom}px)`, transition: isDragging ? 'none' : 'transform 0.1s', cursor: isDragging ? 'grabbing' : 'grab', display: 'block', maxWidth: '90vw', maxHeight: '90vh' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              draggable={false}
            />
          </div>
        </div>
      )}
    </>
  );
}
