'use client';

import { useState, useRef } from 'react';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Post, usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { db, storage } from '@/lib/firebase';
import { useEscClose } from '@/hooks/useEscClose';
import { useToastStore } from '@/store/toastStore';

interface PostItemProps {
  post: Post;
}

type VisibilityType = 'all' | 'me' | 'specific';

export default function PostItem({ post }: PostItemProps) {
  const { user } = useAuthStore();
  const { users } = useUserStore();
  const { updatePost, deletePost } = usePostStore();
  const { addToast } = useToastStore();

  const canEdit = !!(user && (user.email === post.author || user.role === 'admin'));
  const nonAdminUsers = users.filter(u => u.role !== 'admin' && u.email !== post.author);

  const getInitialVisibility = (): VisibilityType => {
    if (!post.visibleTo || post.visibleTo.length === 0) return 'all';
    if (post.visibleTo.length === 1 && post.visibleTo[0] === post.author) return 'me';
    return 'specific';
  };

  const [isHovered, setIsHovered] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(post.content);
  const [editContent, setEditContent] = useState(post.content);
  const [editTaskType, setEditTaskType] = useState<'work' | 'personal'>(post.taskType || 'work');
  const [editVisibility, setEditVisibility] = useState<VisibilityType>(getInitialVisibility());
  const [editSelectedUsers, setEditSelectedUsers] = useState<string[]>(
    post.visibleTo?.filter(e => e !== post.author) ?? []
  );
  const [newFile, setNewFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEscClose(() => setIsEditOpen(false), isEditOpen);

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

  const handleEditSave = async () => {
    if (!editContent.trim()) return;
    setIsUpdating(true);

    try {
      let attachmentUpdate: Record<string, unknown> = {};

      if (removeAttachment) {
        await updateDoc(doc(db, 'posts', post.id), { attachment: deleteField() });
      } else if (newFile && post.attachment && (post.attachment.type === 'image' || post.attachment.type === 'file')) {
        setUploading(true);
        const storageRef = ref(storage, `uploads/${post.panelId}/${Date.now()}_${newFile.name}`);
        await uploadBytes(storageRef, newFile);
        const url = await getDownloadURL(storageRef);
        attachmentUpdate = { attachment: { type: post.attachment.type, url, name: newFile.name } };
        setUploading(false);
      } else if (newFile && !post.attachment) {
        setUploading(true);
        const fileType = newFile.type.startsWith('image/') ? 'image' : 'file';
        const storageRef = ref(storage, `uploads/${post.panelId}/${Date.now()}_${newFile.name}`);
        await uploadBytes(storageRef, newFile);
        const url = await getDownloadURL(storageRef);
        attachmentUpdate = { attachment: { type: fileType, url, name: newFile.name } };
        setUploading(false);
      } else if (post.attachment && !removeAttachment) {
        attachmentUpdate = { attachment: post.attachment };
      }

      const visibleTo =
        editVisibility === 'all' ? [] :
        editVisibility === 'me' ? [post.author] :
        [post.author, ...editSelectedUsers.filter(e => e !== post.author)];

      await updatePost(post.id, {
        content: editContent.trim(),
        taskType: editTaskType,
        visibleTo,
        ...attachmentUpdate,
      });
      setIsEditOpen(false);
    } catch (e) {
      console.error(e);
      addToast({ message: '저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    } finally {
      setIsUpdating(false);
      setUploading(false);
    }
  };

  const openEdit = () => {
    setEditTitle(post.content);
    setEditContent(post.content);
    setEditTaskType(post.taskType || 'work');
    setEditVisibility(getInitialVisibility());
    setEditSelectedUsers(post.visibleTo?.filter(e => e !== post.author) ?? []);
    setNewFile(null);
    setRemoveAttachment(false);
    setIsEditingTitle(false);
    setIsEditOpen(true);
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

  const tableRow = (isAlt: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    padding: '10px 20px',
    background: isAlt ? '#F5EFE9' : '#fff',
    borderBottom: '1px solid #EDE5DC',
    gap: 12,
  });

  const labelStyle: React.CSSProperties = {
    width: 52,
    flexShrink: 0,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: '#C4B8B0',
    textTransform: 'uppercase',
    paddingTop: 2,
  };

  const taskBtnStyle = (task: 'work' | 'personal'): React.CSSProperties => {
    const isOn = editTaskType === task;

    if (task === 'work') {
      return {
        fontSize: 11,
        padding: '5px 13px',
        borderRadius: 3,
        cursor: 'pointer',
        border: `1px solid ${isOn ? '#C17B6B' : 'rgba(193,123,107,0.35)'}`,
        color: isOn ? '#C17B6B' : 'rgba(193,123,107,0.45)',
        background: isOn ? '#FFF5F2' : 'transparent',
        transition: 'all 0.15s ease',
      };
    }

    return {
      fontSize: 11,
      padding: '5px 13px',
      borderRadius: 3,
      cursor: 'pointer',
      border: `1px solid ${isOn ? '#7B5EA7' : 'rgba(123,94,167,0.35)'}`,
      color: isOn ? '#7B5EA7' : 'rgba(123,94,167,0.45)',
      background: isOn ? '#F0ECF5' : 'transparent',
      transition: 'all 0.15s ease',
    };
  };

  const visBtnStyle = (visibility: VisibilityType): React.CSSProperties => {
    const isOn = editVisibility === visibility;
    const map = {
      all: { on: '#3B6D11', border: '#639922', offC: 'rgba(59,109,17,0.45)', offB: 'rgba(99,153,34,0.35)' },
      me: { on: '#185FA5', border: '#378ADD', offC: 'rgba(24,95,165,0.45)', offB: 'rgba(55,138,221,0.35)' },
      specific: { on: '#854F0B', border: '#BA7517', offC: 'rgba(133,79,11,0.45)', offB: 'rgba(186,117,23,0.35)' },
    };
    const colorSet = map[visibility];

    return {
      fontSize: 11,
      padding: '5px 13px',
      borderRadius: 3,
      cursor: 'pointer',
      border: `1px solid ${isOn ? colorSet.border : colorSet.offB}`,
      color: isOn ? colorSet.on : colorSet.offC,
      background: 'none',
      transition: 'all 0.15s ease',
    };
  };

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
            onClick={() => setIsModalOpen(true)}
          />
        </div>
      );
    }

    if (type === 'file') {
      return (
        <div style={{ marginTop: 8 }}>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#C17B6B', display: 'flex', alignItems: 'center', gap: 6 }}>
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
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#C17B6B', wordBreak: 'break-all' }}>
            {url}
          </a>
        </div>
      );
    }

    return null;
  };

  const renderEditAttachment = () => {
    if (removeAttachment) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#C4B8B0', flex: 1 }}>삭제 예정</span>
          <span onClick={() => setRemoveAttachment(false)} style={{ fontSize: 10, color: '#C17B6B', cursor: 'pointer', border: '1px solid #C17B6B', padding: '1px 7px', borderRadius: 2 }}>
            취소
          </span>
        </div>
      );
    }

    if (post.attachment && !newFile) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, fontSize: 12, color: '#2C1810', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.attachment.name || '첨부파일'}</span>
          <a href={post.attachment.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 10, color: '#185FA5', border: '1px solid #378ADD', padding: '1px 7px', borderRadius: 2, cursor: 'pointer', textDecoration: 'none', flexShrink: 0 }}>열기</a>
          <span onClick={() => setRemoveAttachment(true)} style={{ fontSize: 10, color: '#C17B6B', border: '1px solid #C17B6B', padding: '1px 7px', borderRadius: 2, cursor: 'pointer', flexShrink: 0 }}>
            삭제
          </span>
        </div>
      );
    }

    if (newFile) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, fontSize: 12, color: '#C17B6B' }}>{newFile.name}</span>
          <span onClick={() => setNewFile(null)} style={{ fontSize: 10, color: '#9E8880', cursor: 'pointer' }}>
            취소
          </span>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#C4B8B0', flex: 1 }}>없음</span>
        <span onClick={() => fileInputRef.current?.click()} style={{ fontSize: 10, color: '#C17B6B', border: '1px solid #C17B6B', padding: '1px 7px', borderRadius: 2, cursor: 'pointer' }}>
          + 추가
        </span>
      </div>
    );
  };

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: getLeftBorderColor(), pointerEvents: 'none' }} />

        {canEdit && (
          <div onClick={openEdit} style={{ position: 'absolute', left: 46, top: 0, right: 0, bottom: 0, zIndex: 1, cursor: 'pointer' }} />
        )}

        {canEdit && (
          <button
            onClick={e => {
              e.stopPropagation();
              handleStar();
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', opacity: post.starred ? 1 : 0.25, transition: 'opacity 0.15s ease', position: 'relative', zIndex: 2 }}
            onMouseEnter={e => {
              if (!post.starred) e.currentTarget.style.opacity = '0.6';
            }}
            onMouseLeave={e => {
              if (!post.starred) e.currentTarget.style.opacity = '0.25';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L7 1z" stroke="#C17B6B" strokeWidth="1.2" fill={post.starred ? '#C17B6B' : 'none'} />
            </svg>
          </button>
        )}

        <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 0 }}>
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
            onClick={e => {
              e.stopPropagation();
              handleDelete();
            }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setIsEditOpen(false)}>
          <div style={{ background: '#fff', border: '1px solid #EDE5DC', borderRadius: 6, width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: '#5C1F1F', padding: '14px 20px 12px', flexShrink: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(253,248,244,0.45)', textTransform: 'uppercase', marginBottom: 6 }}>
                메모
              </div>
              {isEditingTitle ? (
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') setIsEditingTitle(false);
                  }}
                  autoFocus
                  style={{ fontSize: 15, fontWeight: 700, color: '#FDF8F4', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(253,248,244,0.4)', outline: 'none', width: '100%', fontFamily: 'inherit', padding: '2px 0' }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#FDF8F4', lineHeight: 1.4 }}>
                    {editTitle || post.content.slice(0, 20)}
                  </span>
                  {canEdit && (
                    <span onClick={() => setIsEditingTitle(true)} style={{ opacity: 0.25, cursor: 'pointer', transition: 'opacity 0.15s ease', display: 'flex', alignItems: 'center' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.25')}>
                      <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                        <path d="M8.5 1.5l2 2L3 11H1v-2L8.5 1.5z" stroke="#FDF8F4" strokeWidth="1.2" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </div>
              )}
              <div style={{ fontSize: 10, color: 'rgba(253,248,244,0.45)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5 }}>
                  <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="#FDF8F4" strokeWidth="1" />
                  <path d="M1 5h10M4 1v2M8 1v2" stroke="#FDF8F4" strokeWidth="1" strokeLinecap="round" />
                </svg>
                {formatDate(post.createdAt)}
              </div>
            </div>

            <div style={{ background: '#FDF8F4', borderBottom: '1px solid #EDE5DC', padding: '7px 20px', display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#9E8880', paddingRight: 10, borderRight: '1px solid #D5C9C0', marginRight: 10 }}>
                메모
              </span>
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: editTaskType === 'personal' ? '#F0ECF5' : '#FFF5F2', color: editTaskType === 'personal' ? '#7B5EA7' : '#C17B6B', border: `1px solid ${editTaskType === 'personal' ? '#7B5EA7' : '#C17B6B'}`, marginRight: 4 }}>
                {editTaskType === 'work' ? '업무' : '개인'}
              </span>
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'none', color: editVisibility === 'all' ? '#3B6D11' : editVisibility === 'me' ? '#185FA5' : '#854F0B', border: `1px solid ${editVisibility === 'all' ? '#639922' : editVisibility === 'me' ? '#378ADD' : '#BA7517'}` }}>
                {editVisibility === 'all' ? '전체' : editVisibility === 'me' ? '나만' : '특정'}
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={tableRow(false)}>
                <div style={labelStyle}>내용</div>
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} style={{ flex: 1, border: 'none', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6 }} />
              </div>

              <div style={tableRow(true)}>
                <div style={labelStyle}>첨부</div>
                <div style={{ flex: 1 }}>{renderEditAttachment()}</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="*/*"
                  onClick={e => {
                    (e.target as HTMLInputElement).value = '';
                  }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewFile(file);
                      setRemoveAttachment(false);
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </div>

              <div style={tableRow(false)}>
                <div style={labelStyle}>구분</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {(['work', 'personal'] as const).map(task => (
                    <div key={task} onClick={() => setEditTaskType(task)} style={taskBtnStyle(task)}>
                      {task === 'work' ? '업무' : '개인'}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...tableRow(true), flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                  <div style={labelStyle}>범위</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {(['all', 'me', 'specific'] as VisibilityType[]).map(visibility => (
                      <div key={visibility} onClick={() => setEditVisibility(visibility)} style={visBtnStyle(visibility)}>
                        {visibility === 'all' ? '전체' : visibility === 'me' ? '나만' : '특정'}
                      </div>
                    ))}
                  </div>
                </div>
                {editVisibility === 'specific' && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', paddingLeft: 64 }}>
                    {nonAdminUsers.map(currentUser => {
                      const selected = editSelectedUsers.includes(currentUser.email);
                      return (
                        <div
                          key={currentUser.email}
                          onClick={() => setEditSelectedUsers(prev => selected ? prev.filter(email => email !== currentUser.email) : [...prev, currentUser.email])}
                          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', border: selected ? '1px solid #BA7517' : '1px solid rgba(186,117,23,0.32)', color: selected ? '#854F0B' : 'rgba(133,79,11,0.42)', background: selected ? 'rgba(186,117,23,0.07)' : 'none' }}
                        >
                          {currentUser.name || currentUser.email.split('@')[0]}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: '#FDF8F4', borderTop: '1px solid #EDE5DC', padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span onClick={() => setIsEditOpen(false)} style={{ fontSize: 12, color: '#9E8880', cursor: 'pointer', padding: '5px 2px' }}>
                  닫기
                </span>
                <span onClick={async () => { await handleDelete(); setIsEditOpen(false); }} style={{ fontSize: 12, color: '#C17B6B', border: '1px solid #C17B6B', background: 'none', padding: '5px 12px', borderRadius: 3, cursor: 'pointer' }}>
                  삭제
                </span>
              </div>
              <span onClick={!isUpdating && !uploading ? handleEditSave : undefined} style={{ fontSize: 12, fontWeight: 700, padding: '6px 18px', borderRadius: 3, background: isUpdating || uploading ? '#9E8880' : '#2C1810', color: '#FDF8F4', cursor: isUpdating || uploading ? 'not-allowed' : 'pointer', transition: 'background 0.15s ease' }}>
                {uploading ? '업로드 중...' : isUpdating ? '저장 중...' : '저장'}
              </span>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && post.attachment?.type === 'image' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setIsModalOpen(false); setZoom(1); setDragPos({ x: 0, y: 0 }); }}>
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{Math.round(zoom * 100)}%</span>
            <span onClick={e => { e.stopPropagation(); setZoom(1); setDragPos({ x: 0, y: 0 }); }} style={{ color: '#fff', background: 'rgba(255,255,255,0.15)', border: 'none', padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>
              초기화
            </span>
          </div>
          <div style={{ overflow: 'hidden', maxWidth: '90vw', maxHeight: '90vh' }} onWheel={handleWheel} onClick={e => e.stopPropagation()}>
            <img src={post.attachment.url} alt="확대 이미지" style={{ transform: `scale(${zoom}) translate(${dragPos.x / zoom}px, ${dragPos.y / zoom}px)`, transition: isDragging ? 'none' : 'transform 0.1s', cursor: isDragging ? 'grabbing' : 'grab', display: 'block', maxWidth: '90vw', maxHeight: '90vh' }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} draggable={false} />
          </div>
        </div>
      )}
    </>
  );
}
