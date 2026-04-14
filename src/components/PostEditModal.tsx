'use client';

import { useState, useRef, useEffect } from 'react';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Post, usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { db, storage } from '@/lib/firebase';
import { useToastStore } from '@/store/toastStore';
import { colors } from '@/styles/tokens';

interface PostEditModalProps {
  post: Post;
  onClose: () => void;
}

type VisibilityType = 'all' | 'me' | 'specific';

export default function PostEditModal({ post, onClose }: PostEditModalProps) {
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const formatDate = (date: Date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const handleDelete = async () => {
    if (!canEdit) return;
    try {
      await deletePost(post.id);
      onClose();
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
      onClose();
    } catch (e) {
      console.error(e);
      addToast({ message: '저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    } finally {
      setIsUpdating(false);
      setUploading(false);
    }
  };

  const tableRow = (isAlt: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    padding: '10px 20px',
    background: isAlt ? colors.altRowBg : '#fff',
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
        fontSize: 11, padding: '5px 13px', borderRadius: 3, cursor: 'pointer',
        border: `1px solid ${isOn ? '#C17B6B' : 'rgba(193,123,107,0.35)'}`,
        color: isOn ? '#C17B6B' : 'rgba(193,123,107,0.45)',
        background: isOn ? '#FFF5F2' : 'transparent',
        transition: 'all 0.15s ease',
      };
    }
    return {
      fontSize: 11, padding: '5px 13px', borderRadius: 3, cursor: 'pointer',
      border: `1px solid ${isOn ? '#7B5EA7' : 'rgba(123,94,167,0.35)'}`,
      color: isOn ? '#7B5EA7' : 'rgba(123,94,167,0.45)',
      background: isOn ? '#F0ECF5' : 'transparent',
      transition: 'all 0.15s ease',
    };
  };

  const visBtnStyle = (visibility: VisibilityType): React.CSSProperties => {
    const isOn = editVisibility === visibility;
    const map = {
      all:      { on: '#3B6D11', border: '#639922', offC: 'rgba(59,109,17,0.45)',  offB: 'rgba(99,153,34,0.35)' },
      me:       { on: '#185FA5', border: '#378ADD', offC: 'rgba(24,95,165,0.45)',  offB: 'rgba(55,138,221,0.35)' },
      specific: { on: '#854F0B', border: '#BA7517', offC: 'rgba(133,79,11,0.45)', offB: 'rgba(186,117,23,0.35)' },
    };
    const c = map[visibility];
    return {
      fontSize: 11, padding: '5px 13px', borderRadius: 3, cursor: 'pointer',
      border: `1px solid ${isOn ? c.border : c.offB}`,
      color: isOn ? c.on : c.offC,
      background: 'none',
      transition: 'all 0.15s ease',
    };
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
          <span style={{ flex: 1, fontSize: 12, color: '#2C1810', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.attachment.name || '첨부파일'}
          </span>
          <a href={post.attachment.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 10, color: '#185FA5', border: '1px solid #378ADD', padding: '1px 7px', borderRadius: 2, cursor: 'pointer', textDecoration: 'none', flexShrink: 0 }}>
            열기
          </a>
          <span onClick={() => setRemoveAttachment(true)}
            style={{ fontSize: 10, color: '#C17B6B', border: '1px solid #C17B6B', padding: '1px 7px', borderRadius: 2, cursor: 'pointer', flexShrink: 0 }}>
            삭제
          </span>
        </div>
      );
    }

    if (newFile) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, fontSize: 12, color: '#C17B6B' }}>{newFile.name}</span>
          <span onClick={() => setNewFile(null)} style={{ fontSize: 10, color: '#9E8880', cursor: 'pointer' }}>취소</span>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#C4B8B0', flex: 1 }}>없음</span>
        <span onClick={() => fileInputRef.current?.click()}
          style={{ fontSize: 10, color: '#C17B6B', border: '1px solid #C17B6B', padding: '1px 7px', borderRadius: 2, cursor: 'pointer' }}>
          + 추가
        </span>
      </div>
    );
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', border: '1px solid #EDE5DC', borderRadius: 6, width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ background: '#5C1F1F', padding: '14px 20px 12px', flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(253,248,244,0.45)', textTransform: 'uppercase', marginBottom: 6 }}>
            메모
          </div>
          {isEditingTitle ? (
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={e => { if (e.key === 'Enter') setIsEditingTitle(false); }}
              autoFocus
              style={{ fontSize: 15, fontWeight: 700, color: '#FDF8F4', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(253,248,244,0.4)', outline: 'none', width: '100%', fontFamily: 'inherit', padding: '2px 0' }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#FDF8F4', lineHeight: 1.4 }}>
                {editTitle || post.content.slice(0, 20)}
              </span>
              {canEdit && (
                <span
                  onClick={() => setIsEditingTitle(true)}
                  style={{ opacity: 0.25, cursor: 'pointer', transition: 'opacity 0.15s ease', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.25')}
                >
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

        {/* 상태바 */}
        <div style={{ background: '#FDF8F4', borderBottom: '1px solid #EDE5DC', padding: '7px 20px', display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#9E8880', paddingRight: 10, borderRight: `1px solid ${colors.divider}`, marginRight: 10 }}>
            메모
          </span>
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: editTaskType === 'personal' ? '#F0ECF5' : '#FFF5F2', color: editTaskType === 'personal' ? '#7B5EA7' : '#C17B6B', border: `1px solid ${editTaskType === 'personal' ? '#7B5EA7' : '#C17B6B'}`, marginRight: 4 }}>
            {editTaskType === 'work' ? '업무' : '개인'}
          </span>
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'none', color: editVisibility === 'all' ? '#3B6D11' : editVisibility === 'me' ? '#185FA5' : '#854F0B', border: `1px solid ${editVisibility === 'all' ? '#639922' : editVisibility === 'me' ? '#378ADD' : '#BA7517'}` }}>
            {editVisibility === 'all' ? '전체' : editVisibility === 'me' ? '나만' : '특정'}
          </span>
        </div>

        {/* 바디 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={tableRow(false)}>
            <div style={labelStyle}>내용</div>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={4}
              style={{ flex: 1, border: 'none', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
            />
          </div>

          <div style={tableRow(true)}>
            <div style={labelStyle}>첨부</div>
            <div style={{ flex: 1 }}>{renderEditAttachment()}</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              onClick={e => { (e.target as HTMLInputElement).value = ''; }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) { setNewFile(file); setRemoveAttachment(false); }
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
                      onClick={() => setEditSelectedUsers(prev =>
                        selected ? prev.filter(email => email !== currentUser.email) : [...prev, currentUser.email]
                      )}
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

        {/* 푸터 */}
        <div style={{ background: '#FDF8F4', borderTop: '1px solid #EDE5DC', padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span onClick={onClose} style={{ fontSize: 12, color: '#9E8880', cursor: 'pointer', padding: '5px 2px' }}>
              닫기
            </span>
            <span
              onClick={handleDelete}
              style={{ fontSize: 12, color: '#C17B6B', border: '1px solid #C17B6B', background: 'none', padding: '5px 12px', borderRadius: 3, cursor: 'pointer' }}
            >
              삭제
            </span>
          </div>
          <span
            onClick={!isUpdating && !uploading ? handleEditSave : undefined}
            style={{ fontSize: 12, fontWeight: 700, padding: '6px 18px', borderRadius: 3, background: isUpdating || uploading ? '#9E8880' : '#2C1810', color: '#FDF8F4', cursor: isUpdating || uploading ? 'not-allowed' : 'pointer', transition: 'background 0.15s ease' }}
          >
            {uploading ? '업로드 중...' : isUpdating ? '저장 중...' : '저장'}
          </span>
        </div>
      </div>
    </div>
  );
}
