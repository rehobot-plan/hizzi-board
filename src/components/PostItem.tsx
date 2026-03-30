'use client';

import { useState, useRef } from 'react';
import { Post, usePostStore } from '@/store/postStore';
import { usePanelStore } from '@/store/panelStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';

interface PostItemProps {
  post: Post;
}

export default function PostItem({ post }: PostItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuthStore();
  const { updatePost, deletePost } = usePostStore();
  const { panels } = usePanelStore();
  const { users } = useUserStore();

  const panel = panels.find(p => p.id === post.panelId);
  const categories = panel?.categories || ['공지', '메모', '첨부파일'];
  const canEdit = user && (user.email === post.author || user.role === 'admin');

  const getAuthorName = (email: string) => {
    const u = users.find(u => u.email === email);
    if (u?.name) return u.name;
    return email?.split('@')[0] || email;
  };

  const formatDate = (date: Date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = () => {
    if (!canEdit) return;
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ x: 0, y: 0 });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setIsDeleting(true);
    try {
      await deletePost(post.id);
      setContextMenu(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setIsUpdating(true);
    try {
      await updatePost(post.id, { content: editContent.trim() });
      setIsEditOpen(false);
      setContextMenu(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
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

  const renderContent = () => {
    switch (post.type) {
      case 'image':
        if (imageError) return <p style={{ fontSize: 12, color: '#9E8880', fontStyle: 'italic' }}>이미지를 불러올 수 없습니다</p>;
        return (
          <img
            src={post.content}
            alt="게시물 이미지"
            style={{ maxWidth: '100%', height: 'auto', cursor: 'pointer', display: 'block' }}
            onClick={() => setIsModalOpen(true)}
            onError={() => setImageError(true)}
          />
        );
      case 'link':
        return (
          <a href={post.content} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: '#C17B6B', wordBreak: 'break-all' }}>
            {post.content}
          </a>
        );
      case 'file':
        return (
          <a href={post.content} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: '#C17B6B', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 1h6l3 3v9H3V1z" stroke="#C17B6B" strokeWidth="1.2"/>
              <path d="M8 1v3h3" stroke="#C17B6B" strokeWidth="1.2"/>
            </svg>
            {post.content?.split('/').pop()?.split('?')[0] || '첨부파일'}
          </a>
        );
      default:
        return <p style={{ fontSize: 13, color: '#2C1810', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.content}</p>;
    }
  };

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setContextMenu(null)}
        style={{
          padding: '12px 0',
          borderBottom: '1px solid #EDE5DC',
          borderLeft: isHovered ? '2px solid #C17B6B' : '2px solid transparent',
          paddingLeft: isHovered ? 8 : 0,
          transition: 'all 0.15s ease',
          cursor: 'default',
        }}
      >
        {renderContent()}
        <div style={{ fontSize: 11, color: '#9E8880', marginTop: 4, display: 'flex', gap: 8 }}>
          <span>{getAuthorName(post.author)}</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && canEdit && (
        <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)}>
          <div
            style={{
              position: 'fixed',
              top: contextMenu.x === 0 ? '50%' : contextMenu.y,
              left: contextMenu.x === 0 ? '50%' : contextMenu.x,
              transform: contextMenu.x === 0 ? 'translate(-50%,-50%)' : 'none',
              background: '#fff',
              border: '1px solid #EDE5DC',
              zIndex: 50,
              minWidth: 160,
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { setEditContent(post.content); setIsEditOpen(true); setContextMenu(null); }}
              style={{ display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 12, color: '#2C1810', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FDF8F4')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              편집
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{ display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 12, color: '#C17B6B', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FDF8F4')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
            {categories.filter(c => c !== post.category).length > 0 && (
              <>
                <div style={{ borderTop: '1px solid #EDE5DC', margin: '4px 0' }} />
                <div style={{ padding: '4px 14px', fontSize: 10, color: '#C4B8B0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>탭 이동</div>
                {categories.filter(c => c !== post.category).map(cat => (
                  <button
                    key={cat}
                    onClick={async () => { await updatePost(post.id, { category: cat }); setContextMenu(null); }}
                    style={{ display: 'block', width: '100%', padding: '6px 14px', textAlign: 'left', fontSize: 12, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FDF8F4')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    {cat}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {isModalOpen && post.type === 'image' && !imageError && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { setIsModalOpen(false); setZoom(1); setDragPos({ x: 0, y: 0 }); }}
        >
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{Math.round(zoom * 100)}%</span>
            <button
              onClick={e => { e.stopPropagation(); setZoom(1); setDragPos({ x: 0, y: 0 }); }}
              style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', border: 'none', padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
            >
              초기화
            </button>
          </div>
          <div
            style={{ overflow: 'hidden', maxWidth: '90vw', maxHeight: '90vh' }}
            onWheel={handleWheel}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={post.content}
              alt="확대 이미지"
              style={{
                transform: `scale(${zoom}) translate(${dragPos.x / zoom}px, ${dragPos.y / zoom}px)`,
                transition: isDragging ? 'none' : 'transform 0.1s',
                cursor: isDragging ? 'grabbing' : 'grab',
                display: 'block',
                maxWidth: '90vw',
                maxHeight: '90vh',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              draggable={false}
            />
          </div>
        </div>
      )}

      {/* 편집 모달 */}
      {isEditOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 480 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE5DC' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>게시물 편집</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={4}
                style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit' }}
                disabled={isUpdating}
              />
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setIsEditOpen(false)} style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
              <button
                onClick={handleEdit}
                disabled={isUpdating}
                style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: '#2C1810', color: '#FDF8F4', border: 'none', cursor: 'pointer' }}
              >
                {isUpdating ? '수정 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
