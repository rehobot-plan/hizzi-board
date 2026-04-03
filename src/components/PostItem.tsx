'use client';

import { useState, useRef } from 'react';
import { Post, usePostStore } from '@/store/postStore';
import { usePanelStore } from '@/store/panelStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';

interface PostItemProps {
  post: Post;
}

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 1h6l3 3v9H3V1z" stroke="#C17B6B" strokeWidth="1.2"/>
    <path d="M8 1v3h3" stroke="#C17B6B" strokeWidth="1.2"/>
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

export default function PostItem({ post }: PostItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const { user } = useAuthStore();
  const { updatePost, deletePost } = usePostStore();
  const { panels } = usePanelStore();
  const { users } = useUserStore();

  const panel = panels.find(p => p.id === post.panelId);
  const REMOVED_TABS = ['결재', '전체'];
  const DEFAULT_TABS = ['할일', '메모'];
  const rawCats = panel?.categories?.filter(c => !REMOVED_TABS.includes(c)) || [];
  const validCats = rawCats.length > 0 ? rawCats : DEFAULT_TABS;
  const movableCats = validCats.filter(c => c !== post.category);
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

  const handleMenuOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const estMenuH = 80 + movableCats.length * 30;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < estMenuH ? rect.top - estMenuH - 4 : rect.bottom + 4;
    setMenuPos({ top, left: rect.right - 160 });
    setShowMenu(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePost(post.id);
      setIsDeleteOpen(false);
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
          <>
            <img src={post.content} alt="게시물 이미지"
              style={{ maxWidth: '100%', height: 'auto', cursor: 'pointer', display: 'block' }}
              onClick={() => setIsModalOpen(true)} onError={() => setImageError(true)} />
            {post.caption && (
              <p style={{ fontSize: 12, color: '#9E8880', marginTop: 4, lineHeight: 1.5 }}>{post.caption}</p>
            )}
          </>
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
          <>
            <a href={post.content} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: '#C17B6B', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileIcon />
              {post.content?.split('/').pop()?.split('?')[0] || '첨부파일'}
            </a>
            {post.caption && (
              <p style={{ fontSize: 12, color: '#9E8880', marginTop: 4, lineHeight: 1.5 }}>{post.caption}</p>
            )}
          </>
        );
      default:
        return (
          <p style={{ fontSize: 13, color: '#2C1810', lineHeight: 1.6, whiteSpace: 'pre-wrap', transition: 'color 0.15s ease' }}>
            {post.content}
          </p>
        );
    }
  };

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          padding: '12px 0',
          borderBottom: '1px solid #EDE5DC',
          position: 'relative',
          cursor: 'default',
        }}
      >
        {/* 레이어 1: hover 배경 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: isHovered ? '#FDF8F4' : 'transparent',
          margin: '0 -20px',
          transition: 'background 0.15s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* 레이어 2: hover 텍스트 색상 (내용 위에 올라가지 않게 포인터 없음) */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {canEdit && (
            <button
              ref={btnRef}
              onClick={handleMenuOpen}
              style={{
                position: 'absolute', top: -2, right: 0,
                background: 'none', border: 'none', cursor: 'pointer',
                color: isHovered ? '#9E8880' : 'transparent',
                fontSize: 16, padding: '4px 8px', lineHeight: 1,
                transition: 'color 0.15s ease',
                zIndex: 10,
              }}
            >
              ···
            </button>
          )}
          <div style={{ color: isHovered ? '#7A2828' : '#2C1810', transition: 'color 0.15s ease' }}>
            {renderContent()}
          </div>
          <div style={{ fontSize: 11, color: isHovered ? '#C17B6B' : '#9E8880', marginTop: 4, display: 'flex', gap: 8, transition: 'color 0.15s ease' }}>
            <span>{getAuthorName(post.author)}</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* ··· 메뉴 */}
      {showMenu && canEdit && (
        <div
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, background: '#fff', border: '1px solid #EDE5DC', zIndex: 100, minWidth: 160, boxShadow: '0 4px 12px rgba(44,20,16,0.08)' }}
          onMouseLeave={() => setShowMenu(false)}
        >
          <button
            onClick={() => { setShowMenu(false); setEditContent(post.content); setIsEditOpen(true); }}
            style={{ display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 12, color: '#2C1810', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FDF8F4')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >수정</button>
          <button
            onClick={() => { setShowMenu(false); setIsDeleteOpen(true); }}
            style={{ display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 12, color: '#C17B6B', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FFF5F2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >삭제</button>
        </div>
      )}

      {/* 삭제 모달 */}
      {isDeleteOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 360, zIndex: 1001 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE5DC' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>게시물 삭제</span>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: 13, color: '#2C1810', lineHeight: 1.6 }}>이 게시물을 삭제할까요?</p>
              <p style={{ fontSize: 11, color: '#9E8880', marginTop: 4 }}>삭제된 게시물은 복구할 수 없습니다.</p>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setIsDeleteOpen(false)}
                style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>
                취소
              </button>
              <button onClick={handleDelete} disabled={isDeleting}
                style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: '#C17B6B', color: '#FDF8F4', border: 'none', cursor: isDeleting ? 'not-allowed' : 'pointer' }}>
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {isModalOpen && post.type === 'image' && !imageError && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { setIsModalOpen(false); setZoom(1); setDragPos({ x: 0, y: 0 }); }}>
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{Math.round(zoom * 100)}%</span>
            <button onClick={e => { e.stopPropagation(); setZoom(1); setDragPos({ x: 0, y: 0 }); }}
              style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', border: 'none', padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>
              초기화
            </button>
          </div>
          <div style={{ overflow: 'hidden', maxWidth: '90vw', maxHeight: '90vh' }}
            onWheel={handleWheel} onClick={e => e.stopPropagation()}>
            <img src={post.content} alt="확대 이미지"
              style={{ transform: `scale(${zoom}) translate(${dragPos.x / zoom}px, ${dragPos.y / zoom}px)`, transition: isDragging ? 'none' : 'transform 0.1s', cursor: isDragging ? 'grabbing' : 'grab', display: 'block', maxWidth: '90vw', maxHeight: '90vh' }}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} draggable={false} />
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {isEditOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 480, zIndex: 1001 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE5DC' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>게시물 수정</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4}
                style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit' }}
                disabled={isUpdating} />
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setIsEditOpen(false)}
                style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
              <button onClick={handleEdit} disabled={isUpdating}
                style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: '#2C1810', color: '#FDF8F4', border: 'none', cursor: 'pointer' }}>
                {isUpdating ? '수정 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
