'use client';

import { useState, useRef } from 'react';
import { Post, usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useVisibilityTooltip } from '@/hooks/useVisibilityTooltip';

interface PostItemProps {
  post: Post;
}

export default function PostItem({ post }: PostItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const getInitialEditVisibility = (): 'all' | 'me' | 'specific' => {
    if (!post.visibleTo || post.visibleTo.length === 0) return 'all';
    if (post.visibleTo.length === 1 && post.visibleTo[0] === post.author) return 'me';
    return 'specific';
  };
  const [editVisibility, setEditVisibility] = useState<'all' | 'me' | 'specific'>(getInitialEditVisibility());
  const [editSelectedUsers, setEditSelectedUsers] = useState<string[]>(
    post.visibleTo?.filter(e => e !== post.author) ?? []
  );
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const { updatePost, deletePost } = usePostStore();
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
  const { users } = useUserStore();
  const { isSpecific, tooltipText } = useVisibilityTooltip(post.visibleTo ?? [], users);

  const canEdit = user && (user.email === post.author || user.role === 'admin');

  const getAuthorName = (email: string) => {
    const u = users.find(u => u.email === email);
    return u?.name || email?.split('@')[0] || email;
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
    setMenuPos({ top: rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right) });
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
    setIsUpdating(true);
    try {
      let attachment = post.attachment;
      if (newFile && post.attachment && (post.attachment.type === 'image' || post.attachment.type === 'file')) {
        setUploading(true);
        const storageRef = ref(storage, `uploads/${post.panelId}/${Date.now()}_${newFile.name}`);
        await uploadBytes(storageRef, newFile);
        const url = await getDownloadURL(storageRef);
        attachment = { type: post.attachment.type, url, name: newFile.name };
        setUploading(false);
      }
      await updatePost(post.id, {
        content: editContent,
        visibleTo: editVisibility === 'all'
          ? []
          : editVisibility === 'me'
          ? [post.author]
          : [post.author, ...editSelectedUsers.filter(e => e !== post.author)],
        ...(attachment ? { attachment } : {}),
      });
      setIsEditOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
      setUploading(false);
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

  const renderAttachment = () => {
    if (!post.attachment) return null;
    const { type, url, name } = post.attachment;

    if (type === 'image') {
      return (
        <div style={{ marginTop: 8 }}>
          <img src={url} alt="첨부 이미지"
            style={{ maxWidth: '100%', height: 'auto', cursor: 'pointer', display: 'block' }}
            onClick={() => setIsModalOpen(true)} />
        </div>
      );
    }
    if (type === 'file') {
      return (
        <div style={{ marginTop: 8 }}>
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#C17B6B', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 1h6l3 3v9H3V1z" stroke="#C17B6B" strokeWidth="1.2"/>
              <path d="M8 1v3h3" stroke="#C17B6B" strokeWidth="1.2"/>
            </svg>
            {name || url.split('/').pop()?.split('?')[0] || '파일'}
          </a>
        </div>
      );
    }
    if (type === 'link') {
      return (
        <div style={{ marginTop: 8 }}>
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#C17B6B', wordBreak: 'break-all' }}>
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
        title={isSpecific ? tooltipText : undefined}
        style={{ padding: '12px 0', borderBottom: '1px solid #EDE5DC', position: 'relative', cursor: 'default' }}
      >
        {/* hover 배경 레이어 */}
        <div style={{ position: 'absolute', inset: 0, background: isHovered ? '#FDF8F4' : 'transparent', transition: 'background 0.15s ease', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {canEdit && (
            <button
              onClick={handleStar}
              style={{
                position: 'absolute', top: -2, left: 0,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 4px', zIndex: 10,
                opacity: post.starred ? 1 : 0.25,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={e => { if (!post.starred) e.currentTarget.style.opacity = '0.6'; }}
              onMouseLeave={e => { if (!post.starred) e.currentTarget.style.opacity = '0.25'; }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L7 1z"
                  stroke="#C17B6B" strokeWidth="1.2" fill={post.starred ? '#C17B6B' : 'none'} />
              </svg>
            </button>
          )}
          {canEdit && (
            <button ref={btnRef} onClick={handleMenuOpen}
              style={{ position: 'absolute', top: -2, right: 0, background: 'none', border: 'none', cursor: 'pointer', color: isHovered ? '#9E8880' : 'transparent', fontSize: 16, padding: '4px 8px', lineHeight: 1, transition: 'color 0.15s ease', zIndex: 10 }}>
              ···
            </button>
          )}
          <p style={{ fontSize: 13, color: isHovered ? '#7A2828' : '#2C1810', lineHeight: 1.6, whiteSpace: 'pre-wrap', transition: 'color 0.15s ease', paddingRight: 24, paddingLeft: canEdit ? 20 : 0 }}>
            {post.content}
          </p>
          {renderAttachment()}
          <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {post.taskType && (
              <span style={{ fontSize: 9, padding: '1px 5px', background: 'none', color: post.taskType === 'work' ? '#C17B6B' : '#9E8880', border: post.taskType === 'work' ? '1px solid #C17B6B' : '1px solid #9E8880' }}>
                {post.taskType === 'work' ? '업무' : '개인'}
              </span>
            )}
            {(() => {
              const label =
                !post.visibleTo || post.visibleTo.length === 0 ? '전체' :
                post.visibleTo.length === 1 && post.visibleTo[0] === post.author ? '나만' : '특정';
              const color = label === '전체' ? '#639922' : label === '나만' ? '#378ADD' : '#BA7517';
              return (
                <span style={{ fontSize: 9, padding: '1px 5px', color, border: `1px solid ${color}` }}>
                  {label}
                </span>
              );
            })()}
            <span style={{ fontSize: 9, color: '#C4B8B0', marginLeft: 'auto' }}>{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* ··· 메뉴 */}
      {showMenu && canEdit && (
        <div style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, background: '#fff', border: '1px solid #EDE5DC', zIndex: 100, minWidth: 100, boxShadow: '0 4px 12px rgba(44,20,16,0.08)' }}
          onMouseLeave={() => setShowMenu(false)}>
          <button
            onClick={() => { setShowMenu(false); setEditContent(post.content); setEditVisibility(getInitialEditVisibility()); setEditSelectedUsers(post.visibleTo?.filter(e => e !== post.author) ?? []); setNewFile(null); setIsEditOpen(true); }}
            style={{ display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 12, color: '#2C1810', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FDF8F4')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            수정
          </button>
          <button
            onClick={() => { setShowMenu(false); setIsDeleteOpen(true); }}
            style={{ display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 12, color: '#C17B6B', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FFF5F2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            삭제
          </button>
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
                style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
              <button onClick={handleDelete} disabled={isDeleting}
                style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: '#C17B6B', color: '#FDF8F4', border: 'none', cursor: isDeleting ? 'not-allowed' : 'pointer' }}>
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {isModalOpen && post.attachment?.type === 'image' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { setIsModalOpen(false); setZoom(1); setDragPos({ x: 0, y: 0 }); }}>
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{Math.round(zoom * 100)}%</span>
            <button onClick={e => { e.stopPropagation(); setZoom(1); setDragPos({ x: 0, y: 0 }); }}
              style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', border: 'none', padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>초기화</button>
          </div>
          <div style={{ overflow: 'hidden', maxWidth: '90vw', maxHeight: '90vh' }}
            onWheel={handleWheel} onClick={e => e.stopPropagation()}>
            <img src={post.attachment.url} alt="확대 이미지"
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
            <div style={{ padding: '20px' }}>
              {/* 내용 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>내용</div>
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4}
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit' }} />
              </div>

              {/* 첨부파일 교체 */}
              {post.attachment && (post.attachment.type === 'image' || post.attachment.type === 'file') && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>첨부파일 교체</div>
                  <div onClick={() => fileInputRef.current?.click()}
                    style={{ border: '1px dashed #EDE5DC', padding: 12, textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 11, color: '#9E8880' }}>
                      {newFile ? newFile.name : '클릭하여 파일 교체'}
                    </div>
                    {!newFile && (
                      <div style={{ fontSize: 10, color: '#C4B8B0', marginTop: 4 }}>
                        현재: {post.attachment.name || post.attachment.url.split('/').pop()?.split('?')[0]?.slice(0, 30)}
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file"
                    accept={post.attachment.type === 'image' ? 'image/*' : '*'}
                    onChange={e => { const f = e.target.files?.[0]; if (f) setNewFile(f); }}
                    style={{ display: 'none' }} />
                </div>
              )}

              {/* 보이는 범위 */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>보이는 범위</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['all', 'me', 'specific'] as const).map(v => {
                    const labels = { all: '전체', me: '나만', specific: '특정인' };
                    return (
                      <button key={v} onClick={() => setEditVisibility(v)}
                        style={{ padding: '5px 12px', border: `1px solid ${editVisibility === v ? '#2C1810' : '#EDE5DC'}`, background: editVisibility === v ? '#FDF8F4' : '#fff', fontSize: 10, letterSpacing: '0.06em', color: editVisibility === v ? '#2C1810' : '#9E8880', cursor: 'pointer' }}>
                        {labels[v]}
                      </button>
                    );
                  })}
                </div>
                {editVisibility === 'specific' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {users.filter(u => u.email !== post.author && u.role !== 'admin').map(u => (
                      <button key={u.email}
                        onClick={() => setEditSelectedUsers(prev =>
                          prev.includes(u.email) ? prev.filter(e => e !== u.email) : [...prev, u.email]
                        )}
                        style={{ padding: '4px 10px', fontSize: 10, border: `1px solid ${editSelectedUsers.includes(u.email) ? '#C17B6B' : '#EDE5DC'}`, background: editSelectedUsers.includes(u.email) ? '#FFF5F2' : '#fff', color: editSelectedUsers.includes(u.email) ? '#C17B6B' : '#9E8880', cursor: 'pointer' }}>
                        {u.name || u.email}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setIsEditOpen(false)}
                style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
              <button onClick={handleEdit} disabled={isUpdating || uploading}
                style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: '#2C1810', color: '#FDF8F4', border: 'none', cursor: 'pointer' }}>
                {uploading ? '업로드 중...' : isUpdating ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
