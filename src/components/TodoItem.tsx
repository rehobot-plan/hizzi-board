'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Post, usePostStore } from '@/store/postStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import { useUserStore } from '@/store/userStore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useEscClose } from '@/hooks/useEscClose';
import { useVisibilityTooltip } from '@/hooks/useVisibilityTooltip';

interface TodoItemProps {
  post: Post;
  canEdit: boolean;
}

interface PostUpdates {
  content: string;
  taskType: 'work' | 'personal';
  visibleTo: string[];
  attachment?: { type: 'image' | 'file' | 'link'; url: string; name?: string };
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
  const { isSpecific, tooltipText } = useVisibilityTooltip(post.visibleTo ?? [], users);
  const [checking, setChecking] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTeamTooltip, setShowTeamTooltip] = useState(false);
  const [showSpecificTooltip, setShowSpecificTooltip] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEscClose(() => setIsEditOpen(false), isEditOpen);
  useEscClose(() => setShowOrderModal(false), showOrderModal);

  const [editContent, setEditContent] = useState(post.content);
  const [editVisibility, setEditVisibility] = useState<'all' | 'me' | 'specific'>(
    !post.visibleTo || post.visibleTo.length === 0 ? 'all'
      : post.visibleTo.length === 1 && post.visibleTo[0] === post.author ? 'me'
      : 'specific'
  );
  const [editSpecificUsers, setEditSpecificUsers] = useState<string[]>(
    post.visibleTo?.filter(e => e !== post.author) ?? []
  );
  const [editTaskType, setEditTaskType] = useState<'work' | 'personal'>(post.taskType || 'work');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const isWork = post.taskType === 'work';
  const tagColor = isWork ? '#C17B6B' : '#9E8880';
  const tagBorder = isWork ? '1px solid #C17B6B' : '1px solid #9E8880';
  const tagLabel = isWork ? '업무' : '개인';

  const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const handleCheck = async () => {
    if (!canEdit || checking || justChecked) return;
    if (post.requestId) {
      setShowOrderModal(true);
      return;
    }
    setJustChecked(true);
    setChecking(true);
    setTimeout(async () => {
      await updatePost(post.id, { completed: true, completedAt: new Date() });
      setChecking(false);
    }, 600);
  };

  const handleComplete = async () => {
    if (!canEdit || isCompleting) return;
    setIsCompleting(true);
    try {
      await updatePost(post.id, { completed: true, completedAt: new Date() });
      if (post.requestId) {
        await completeRequest(post.requestId);
      }
      setShowOrderModal(false);
    } finally {
      setIsCompleting(false);
    }
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
    setEditVisibility(
      !post.visibleTo || post.visibleTo.length === 0 ? 'all'
        : post.visibleTo.length === 1 && post.visibleTo[0] === post.author ? 'me'
        : 'specific'
    );
    setEditSpecificUsers(post.visibleTo?.filter(e => e !== post.author) ?? []);
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

      const updates: PostUpdates = {
        content: editContent.trim(),
        taskType: editTaskType,
        visibleTo: editVisibility === 'all' ? []
          : editVisibility === 'specific' ? [post.author, ...editSpecificUsers.filter(e => e !== post.author)]
          : [post.author],
      };

      if (attachment) {
        updates.attachment = attachment;
      }

      await updatePost(post.id, updates);
      setIsEditOpen(false);
    } catch (e) {
      console.error(e);
      const { useToastStore } = await import('@/store/toastStore');
      useToastStore.getState().addToast({ message: '저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });
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
        onClick={post.requestId && canEdit && !justChecked ? () => setShowOrderModal(true) : undefined}
        style={{
          cursor: post.requestId && canEdit && !justChecked ? 'pointer' : 'default',
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
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 2,
          background: (() => {
            if (post.requestFrom) return '#993556';
            if (post.starred) return '#C17B6B';
            if (!post.visibleTo || post.visibleTo.length === 0) return '#639922';
            if (post.visibleTo.length > 1) return '#BA7517';
            return '#378ADD';
          })(),
          transition: 'background 0.15s ease',
          pointerEvents: 'none',
        }} />

        {canEdit && (
          <button onClick={handleStar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', transition: 'opacity 0.15s ease', opacity: post.starred ? 1 : 0.25 }}
            onMouseEnter={e => { if (!post.starred) e.currentTarget.style.opacity = '0.6'; }}
            onMouseLeave={e => { if (!post.starred) e.currentTarget.style.opacity = '0.25'; }}>
            <StarIcon filled={!!post.starred} />
          </button>
        )}

        {canEdit && !post.requestId && (
          <button onClick={handleCheck} disabled={checking || justChecked}
            style={{ width: 16, height: 16, border: `1.5px solid ${justChecked ? '#C17B6B' : '#EDE5DC'}`, background: justChecked ? '#C17B6B' : '#fff', cursor: justChecked ? 'default' : 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}>
            {justChecked && <CheckIcon />}
          </button>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, lineHeight: 1.5, textDecoration: justChecked ? 'line-through' : 'none', color: justChecked ? '#9E8880' : '#2C1810', whiteSpace: 'pre-wrap', wordBreak: 'break-word', transition: 'all 0.15s ease' }}>
            {renderContent()}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            {!post.requestFrom && <span style={{ fontSize: 9, padding: '1px 6px', background: 'none', color: tagColor, border: tagBorder, letterSpacing: '0.06em' }}>{tagLabel}</span>}
            {!post.requestFrom && (() => {
              const v = post.visibleTo;
              const isAll = !v || v.length === 0;
              const isSpec = v && v.length > 1;
              const label = isAll ? '전체' : isSpec ? '특정' : '나만';
              const color = isAll ? '#3B6D11' : isSpec ? '#854F0B' : '#185FA5';
              const border = isAll ? '1px solid #639922' : isSpec ? '1px solid #BA7517' : '1px solid #378ADD';
              return (
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  <span
                    style={{ fontSize: 9, padding: '1px 6px', background: 'none', color, border, letterSpacing: '0.06em' }}
                    onMouseEnter={() => setShowSpecificTooltip(true)}
                    onMouseLeave={() => setShowSpecificTooltip(false)}
                  >
                    {label}
                  </span>
                  {label === '특정' && showSpecificTooltip && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0,
                      background: '#fff', border: '0.5px solid #EDE5DC',
                      padding: '6px 8px', zIndex: 50, whiteSpace: 'nowrap',
                    }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 240 }}>
                        {post.visibleTo.map(email => {
                          const u = users.find(u => u.email === email);
                          return (
                            <span key={email} style={{
                              fontSize: 9, padding: '2px 7px',
                              background: '#F5F0EE', color: '#9E8880',
                              letterSpacing: '0.04em',
                            }}>
                              {u?.name || email.split('@')[0]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </span>
              );
            })()}
            {post.requestFrom && (
              <>
                <span style={{
                  fontSize: 9, padding: '1px 6px',
                  background: '#FCEEE9', color: '#A0503A',
                  border: '0.5px solid #C17B6B',
                  letterSpacing: '0.06em',
                }}>
                  FROM {post.requestFrom.split('@')[0]}
                </span>
                {post.visibleTo && post.visibleTo.length > 1 && (
                  <div
                    style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                    onMouseEnter={e => { e.stopPropagation(); setShowTeamTooltip(true); }}
                    onMouseLeave={() => setShowTeamTooltip(false)}
                  >
                    <span style={{
                      fontSize: 9, padding: '1px 6px',
                      background: '#F5F0EE', color: '#9E8880',
                      letterSpacing: '0.06em', cursor: 'default',
                    }}>
                      TEAM
                    </span>
                    {showTeamTooltip && (
                      <div style={{
                        position: 'absolute', bottom: 'calc(100% + 4px)', left: 0,
                        background: '#fff', border: '0.5px solid #EDE5DC',
                        padding: '6px 8px', zIndex: 50,
                        whiteSpace: 'nowrap',
                      }}>
                        <div style={{
                          display: 'flex', flexWrap: 'wrap', gap: 4,
                          maxWidth: 240,
                        }}>
                          {post.visibleTo.map(email => {
                            const u = users.find(u => u.email === email);
                            return (
                              <span key={email} style={{
                                fontSize: 9, padding: '2px 7px',
                                background: '#F5F0EE', color: '#9E8880',
                                letterSpacing: '0.04em',
                                flexBasis: post.visibleTo && post.visibleTo.length <= 3 ? 'auto' : 'calc(33% - 4px)',
                              }}>
                                {u?.name || email.split('@')[0]}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <span style={{ fontSize: 9, color: '#C4B8B0', marginLeft: 'auto' }}>{formatDate(post.createdAt)}</span>
            {justChecked && <span style={{ fontSize: 10, color: '#C17B6B', letterSpacing: '0.04em' }}>완료</span>}
          </div>
        </div>

        {canEdit && !justChecked && !post.requestId && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              ref={menuBtnRef}
              onClick={() => setShowMenu(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4B8B0', fontSize: 16, padding: '8px 12px', lineHeight: 1, transition: 'color 0.15s ease' }}>
              ···
            </button>
            {showMenu && typeof window !== 'undefined' && createPortal(
              <div
                style={{
                  position: 'fixed',
                  top: menuBtnRef.current ? menuBtnRef.current.getBoundingClientRect().bottom + 4 : 0,
                  left: menuBtnRef.current ? menuBtnRef.current.getBoundingClientRect().left : 0,
                  background: '#fff', border: '1px solid #EDE5DC',
                  zIndex: 9999, minWidth: 80,
                  boxShadow: '0 4px 12px rgba(44,20,16,0.08)'
                }}
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
              </div>,
              document.body
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
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['me', 'all', 'specific'] as const).map(v => {
                    const labels = { me: '나만', all: '전체', specific: '특정인' };
                    return (
                      <button key={v} onClick={() => setEditVisibility(v)}
                        style={{ padding: '5px 12px', border: `1px solid ${editVisibility === v ? '#2C1810' : '#EDE5DC'}`, background: editVisibility === v ? '#FDF8F4' : '#fff', fontSize: 10, letterSpacing: '0.06em', color: editVisibility === v ? '#2C1810' : '#9E8880', cursor: 'pointer' }}>
                        {labels[v]}
                      </button>
                    );
                  })}
                </div>
                {editVisibility === 'specific' && nonAdminUsers.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {nonAdminUsers.map(u => (
                      <button key={u.email}
                        onClick={() => setEditSpecificUsers(prev =>
                          prev.includes(u.email) ? prev.filter(e => e !== u.email) : [...prev, u.email]
                        )}
                        style={{ padding: '4px 10px', border: `1px solid ${editSpecificUsers.includes(u.email) ? '#C17B6B' : '#EDE5DC'}`, background: editSpecificUsers.includes(u.email) ? '#FFF5F2' : '#fff', fontSize: 10, color: editSpecificUsers.includes(u.email) ? '#C17B6B' : '#9E8880', cursor: 'pointer' }}>
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
              <button onClick={handleEditSave} disabled={isUpdating || uploading}
                style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: '#2C1810', color: '#FDF8F4', border: 'none', cursor: isUpdating ? 'not-allowed' : 'pointer' }}>
                {uploading ? '업로드 중...' : isUpdating ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showOrderModal && post.requestId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowOrderModal(false)}>
          <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 400, zIndex: 1001 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: '#5C1F1F', padding: '18px 22px 14px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FDF8F4', lineHeight: 1.4, marginBottom: 10 }}>
                {post.content}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {post.requestFrom && (
                  <div style={{ fontSize: 10, color: 'rgba(253,248,244,0.65)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="3" r="2" stroke="rgba(253,248,244,0.65)" strokeWidth="1.2"/><path d="M1 9c0-2 1.8-3 4-3s4 1 4 3" stroke="rgba(253,248,244,0.65)" strokeWidth="1.2"/></svg>
                    {post.requestFrom.split('@')[0]} → 나
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'rgba(253,248,244,0.65)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><rect x="1" y="1.5" width="8" height="7" rx="1" stroke="rgba(253,248,244,0.65)" strokeWidth="1.2"/><path d="M3 1v1.5M7 1v1.5M1 4h8" stroke="rgba(253,248,244,0.65)" strokeWidth="1.2"/></svg>
                  {formatDate(post.createdAt)} 등록
                </div>
              </div>
            </div>

            <div style={{ background: '#FCEEE9', padding: '7px 22px', borderBottom: '1px solid #EDE5DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#993556', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#993556', display: 'inline-block' }} />
                진행중
              </span>
              {post.requestDueDate && (
                <span style={{ fontSize: 10, color: '#A0503A', fontWeight: 600, background: '#FFF5F2', border: '0.5px solid #C17B6B', padding: '2px 8px' }}>
                  {new Date(post.requestDueDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}까지
                </span>
              )}
            </div>

            <div style={{ padding: '18px 22px' }}>
              {post.requestContent && (
                <>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 5 }}>상세 내용</div>
                  <div style={{ fontSize: 12, color: '#2C1810', lineHeight: 1.7, marginBottom: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {post.requestContent}
                  </div>
                  <div style={{ height: '0.5px', background: '#EDE5DC', marginBottom: 12 }} />
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                <span style={{ fontSize: 10, color: '#9E8880', width: 36, flexShrink: 0 }}>공개</span>
                <span style={{ fontSize: 9, padding: '2px 7px', letterSpacing: '0.06em',
                  background: !post.visibleTo || post.visibleTo.length === 0 ? 'rgba(99,153,34,0.15)' : post.visibleTo.length > 1 ? 'rgba(186,117,23,0.15)' : 'rgba(55,138,221,0.15)',
                  color: !post.visibleTo || post.visibleTo.length === 0 ? '#3B6D11' : post.visibleTo.length > 1 ? '#854F0B' : '#185FA5',
                  border: !post.visibleTo || post.visibleTo.length === 0 ? '0.5px solid #639922' : post.visibleTo.length > 1 ? '0.5px solid #BA7517' : '0.5px solid #378ADD',
                }}>
                  {!post.visibleTo || post.visibleTo.length === 0 ? '전체' : post.visibleTo.length > 1 ? '특정인' : '나만'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, color: '#9E8880', width: 36, flexShrink: 0 }}>구분</span>
                <span style={{ fontSize: 9, padding: '2px 7px', letterSpacing: '0.06em', background: '#FFF5F2', color: '#C17B6B', border: '0.5px solid #C17B6B' }}>
                  {post.taskType === 'personal' ? '개인' : '업무'}
                </span>
              </div>
            </div>

            <div style={{ padding: '12px 22px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setShowOrderModal(false)}
                style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>
                닫기
              </button>
              <button onClick={handleComplete} disabled={isCompleting}
                style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: '#2C1810', color: '#FDF8F4', border: 'none', cursor: isCompleting ? 'not-allowed' : 'pointer', opacity: isCompleting ? 0.6 : 1 }}>
                {isCompleting ? '처리 중...' : '완료 처리'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
