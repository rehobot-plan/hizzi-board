'use client';

import { useRef, useState } from 'react';
import { Post, usePostStore } from '@/store/postStore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

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
  const [checking, setChecking] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editVisibility, setEditVisibility] = useState<'all' | 'me' | 'specific'>(
    !post.visibleTo || post.visibleTo.length === 0 ? 'all' : 'me'
  );
  const [editTaskType, setEditTaskType] = useState<'work' | 'personal'>(post.taskType || 'work');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const isWork = post.taskType === 'work';
  const tagColor = isWork ? '#C17B6B' : '#9E8880';
  const tagBg = isWork ? '#FFF5F2' : '#F5F0EE';
  const tagLabel = isWork ? '업무' : '개인';

  const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  };

  const handleCheck = async () => {
    if (!canEdit || checking || justChecked) return;
    setJustChecked(true);
    setChecking(true);
    setTimeout(async () => {
      await updatePost(post.id, { completed: true, completedAt: new Date() });
      setChecking(false);
    }, 600);
  };

  const handleStar = async () => {
    if (!canEdit) return;
    await updatePost(post.id, {
      starred: !post.starred,
      starredAt: post.starred ? null : new Date(),
    });
  };

  const handleDelete = async () => {
    if (!canEdit) return;
    await deletePost(post.id);
    setShowMenu(false);
  };

  const handleEditOpen = () => {
    setEditContent(post.content);
    setEditVisibility(!post.visibleTo || post.visibleTo.length === 0 ? 'all' : 'me');
    setEditTaskType(post.taskType || 'work');
    setNewFile(null);
    setShowMenu(false);
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editContent.trim()) return;
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

      const updates: any = {
        content: editContent.trim(),
        taskType: editTaskType,
        visibleTo: editVisibility === 'all' ? [] : [post.author],
      };

      if (attachment) {
        updates.attachment = attachment;
      }

      await updatePost(post.id, updates);
      setIsEditOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
      setUploading(false);
    }
  };

  const renderContent = () => {
    if (post.attachment?.type === 'image') {
      return (
        <>
          <img src={post.attachment.url} alt="할일 이미지"
            style={{ maxWidth: '100%', height: 'auto', display: 'block', opacity: justChecked ? 0.5 : 1 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </>
      );
    }
    if (post.attachment?.type === 'file') {
      return (
        <>
          <a href={post.attachment.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#C17B6B', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M3 1h6l3 3v9H3V1z" stroke="#C17B6B" strokeWidth="1.2"/>
              <path d="M8 1v3h3" stroke="#C17B6B" strokeWidth="1.2"/>
            </svg>
            {post.attachment.name || post.attachment.url.split('/').pop()?.split('?')[0] || '첨부파일'}
          </a>
        </>
      );
    }
    if (post.attachment?.type === 'link') {
      return (
        <a href={post.attachment.url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12, color: '#C17B6B', wordBreak: 'break-all' }}>
          {post.attachment.url}
        </a>
      );
    }
    return post.content;
  };

  return (
    <>
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '10px 20px 10px 28px',
        margin: '0 -20px',
        borderBottom: '1px solid #EDE5DC',
        position: 'relative',
        opacity: justChecked ? 0.4 : 1,
        transition: 'opacity 0.5s ease, transform 0.5s ease, background 0.15s ease',
        transform: justChecked ? 'translateX(8px)' : 'translateX(0)',
        background: isHovered && !justChecked ? '#FDF8F4' : '#fff',
      }}
    >
      {/* 별표 선 레이어 */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 2,
        background: post.starred ? '#C17B6B' : 'transparent',
        transition: 'background 0.15s ease',
        pointerEvents: 'none',
      }} />

      {/* 별표 버튼 */}
      {canEdit && (
        <button onClick={handleStar}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', transition: 'opacity 0.15s ease' }}>
          <StarIcon filled={!!post.starred} />
        </button>
      )}

      {/* 체크박스 */}
      {canEdit && (
        <button onClick={handleCheck} disabled={checking || justChecked}
          style={{ width: 16, height: 16, border: `1.5px solid ${justChecked ? '#C17B6B' : '#EDE5DC'}`, background: justChecked ? '#C17B6B' : '#fff', cursor: justChecked ? 'default' : 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}>
          {justChecked && <CheckIcon />}
        </button>
      )}

      {/* 내용 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, lineHeight: 1.5, textDecoration: justChecked ? 'line-through' : 'none', color: justChecked ? '#9E8880' : '#2C1810', whiteSpace: 'pre-wrap', wordBreak: 'break-word', transition: 'all 0.15s ease' }}>
          {renderContent()}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 9, padding: '1px 6px', background: tagBg, color: tagColor, letterSpacing: '0.06em' }}>{tagLabel}</span>
          <span style={{ fontSize: 10, color: '#C4B8B0' }}>{formatDate(post.createdAt)}</span>
          {justChecked && <span style={{ fontSize: 10, color: '#C17B6B', letterSpacing: '0.04em' }}>완료</span>}
        </div>
      </div>

      {/* 더보기 메뉴 */}
      {canEdit && !justChecked && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            ref={menuBtnRef}
            onClick={() => {
              if (!menuBtnRef.current) return;
              const rect = menuBtnRef.current.getBoundingClientRect();
              setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
              setShowMenu(v => !v);
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4B8B0', fontSize: 16, padding: '8px 12px', lineHeight: 1, transition: 'color 0.15s ease' }}>
            ···
          </button>
          {showMenu && (
            <div style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, background: '#fff', border: '1px solid #EDE5DC', zIndex: 9999, minWidth: 80, boxShadow: '0 4px 12px rgba(44,20,16,0.08)' }}
              onMouseLeave={() => setShowMenu(false)}>
              <button onClick={handleEditOpen}
                style={{ display: 'block', width: '100%', padding: '7px 12px', textAlign: 'left', fontSize: 11, color: '#2C1810', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FDF8F4')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                수정
              </button>
              <button onClick={handleDelete}
                style={{ display: 'block', width: '100%', padding: '7px 12px', textAlign: 'left', fontSize: 11, color: '#C17B6B', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FFF5F2')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                삭제
              </button>
            </div>
          )}
        </div>
      )}
    </div>
    {isEditOpen && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 480, zIndex: 1001 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE5DC' }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>할일 수정</span>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>내용</div>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={3}
                style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {post.attachment && (post.attachment.type === 'image' || post.attachment.type === 'file') && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>첨부파일</div>
                <div onClick={() => fileInputRef.current?.click()}
                  style={{ border: '1px dashed #EDE5DC', padding: 12, textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: 11, color: '#9E8880' }}>
                    {newFile ? newFile.name : '클릭하여 파일 교체'}
                  </div>
                </div>
                <input ref={fileInputRef} type="file"
                  accept={post.attachment.type === 'image' ? 'image/*' : '*'}
                  onChange={e => { const file = e.target.files?.[0]; if (file) setNewFile(file); }}
                  style={{ display: 'none' }} />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>구분</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['work', 'personal'] as const).map(t => {
                  const labels = { work: '업무', personal: '개인' };
                  const activeColor = t === 'work' ? '#C17B6B' : '#9E8880';
                  return (
                    <button key={t} onClick={() => setEditTaskType(t)}
                      style={{ padding: '5px 14px', border: `1px solid ${editTaskType === t ? activeColor : '#EDE5DC'}`, background: editTaskType === t ? (t === 'work' ? '#FFF5F2' : '#F5F0EE') : '#fff', fontSize: 10, letterSpacing: '0.06em', color: editTaskType === t ? activeColor : '#9E8880', cursor: 'pointer' }}>
                      {labels[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>보이는 범위</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['me', 'all'] as const).map(v => {
                  const labels = { me: '나만', all: '전체' };
                  return (
                    <button key={v} onClick={() => setEditVisibility(v)}
                      style={{ padding: '5px 12px', border: `1px solid ${editVisibility === v ? '#2C1810' : '#EDE5DC'}`, background: editVisibility === v ? '#FDF8F4' : '#fff', fontSize: 10, letterSpacing: '0.06em', color: editVisibility === v ? '#2C1810' : '#9E8880', cursor: 'pointer' }}>
                      {labels[v]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setIsEditOpen(false)}
              style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
            <button onClick={handleEditSave} disabled={isUpdating || uploading}
              style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: '#2C1810', color: '#FDF8F4', border: 'none', cursor: isUpdating ? 'not-allowed' : 'pointer' }}>
              {uploading ? '업로드 중...' : isUpdating ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
