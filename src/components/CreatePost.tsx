'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePostStore } from '@/store/postStore';
import { useUserStore } from '@/store/userStore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface CreatePostProps {
  panelId: string;
  onClose: (savedCategory?: string) => void;
  categories?: string[];
  defaultCategory?: string;
}

const BASE_CATEGORIES = ['할일', '메모'];

export default function CreatePost({ panelId, onClose, categories, defaultCategory }: CreatePostProps) {
  const { user } = useAuthStore();
  const { addPost } = usePostStore();
  const { users } = useUserStore();

  const allCategories = categories || BASE_CATEGORIES;

  const getInitialCategory = () => {
    if (!defaultCategory || defaultCategory === '전체') {
      return allCategories[0] || '메모';
    }
    if (allCategories.includes(defaultCategory)) return defaultCategory;
    return allCategories[0] || '메모';
  };

  const [category, setCategory] = useState(getInitialCategory());
  const [taskType, setTaskType] = useState<'work' | 'personal'>('work');
  const [visibility, setVisibility] = useState<'all' | 'me' | 'specific'>(
    defaultCategory === '할일' ? 'me' : 'all'
  );
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [attachType, setAttachType] = useState<'none' | 'image' | 'file' | 'link'>('none');
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachLink, setAttachLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const nonAdminUsers = users.filter(u => u.email !== user?.email && u.role !== 'admin');

  const toggleUser = (email: string) => {
    setSelectedUsers(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!content.trim()) return;

    setUploading(true);

    try {
      let attachment = undefined;

      if (attachType === 'image' || attachType === 'file') {
        if (!attachFile) { setUploading(false); return; }
        const storageRef = ref(storage, `uploads/${panelId}/${Date.now()}_${attachFile.name}`);
        await uploadBytes(storageRef, attachFile);
        const url = await getDownloadURL(storageRef);
        attachment = { type: attachType, url, name: attachFile.name };
      } else if (attachType === 'link' && attachLink.trim()) {
        attachment = { type: 'link' as const, url: attachLink.trim() };
      }

      const visibleTo: string[] = [];
      if (visibility === 'me') visibleTo.push(user.email!);
      else if (visibility === 'specific') visibleTo.push(...selectedUsers);

      const postData: any = {
        panelId,
        content: content.trim(),
        author: user.email!,
        category,
        visibleTo: visibility === 'all' ? [] : visibleTo,
      };

      if (attachment) postData.attachment = attachment;
      if (category === '할일') postData.taskType = taskType;

      await addPost(postData);
      onClose(category);
    } catch (err) {
      console.error('저장 오류:', err);
    } finally {
      setUploading(false);
    }
  };

  const attachIcons = {
    image: <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M2 13l5-5 4 4 2-2 5 5" stroke="currentColor" strokeWidth="1.5"/></svg>,
    file: <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 2h7l4 4v12H5V2z" stroke="currentColor" strokeWidth="1.5"/><path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.5"/></svg>,
    link: <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M8 12s-2-2-2-4a4 4 0 018 0c0 2-2 4-2 4M12 8s2 2 2 4a4 4 0 01-8 0c0-2 2-4 2-4" stroke="currentColor" strokeWidth="1.5"/></svg>,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(44,20,16,0.4)' }}>
      <div className="w-full max-w-lg" style={{ background: '#fff', border: '1px solid #EDE5DC' }}>

        {/* 헤더 */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EDE5DC' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>새 게시물</span>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* 카테고리 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>카테고리</div>
            <div style={{ display: 'flex', borderBottom: '1px solid #EDE5DC' }}>
              {allCategories.map(cat => (
                <button key={cat}
                  onClick={() => {
                    setCategory(cat);
                    if (cat === '할일') setVisibility('me');
                    else setVisibility('all');
                  }}
                  style={{
                    padding: '6px 12px', fontSize: 10, letterSpacing: '0.08em',
                    color: category === cat ? '#2C1810' : '#9E8880',
                    borderBottom: category === cat ? '1.5px solid #C17B6B' : '1.5px solid transparent',
                    marginBottom: -1, background: 'none', border: 'none',
                    borderBottomStyle: 'solid', cursor: 'pointer',
                  }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 내용 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>내용</div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="내용을 입력하세요..."
              rows={4}
              style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* 첨부파일 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>첨부파일 (선택)</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: attachType !== 'none' ? 10 : 0 }}>
              {(['none', 'image', 'file', 'link'] as const).map(t => {
                const labels = { none: '없음', image: '이미지', file: '파일', link: '링크' };
                return (
                  <button key={t}
                    onClick={() => { setAttachType(t); setAttachFile(null); setAttachLink(''); }}
                    style={{
                      padding: '5px 10px', fontSize: 10, letterSpacing: '0.06em',
                      border: `1px solid ${attachType === t ? '#C17B6B' : '#EDE5DC'}`,
                      background: attachType === t ? '#FFF5F2' : '#fff',
                      color: attachType === t ? '#C17B6B' : '#9E8880',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    {t !== 'none' && attachIcons[t]}
                    {labels[t]}
                  </button>
                );
              })}
            </div>

            {(attachType === 'image' || attachType === 'file') && (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: '1px dashed #EDE5DC', padding: 16, textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: 11, color: '#9E8880' }}>
                  {attachFile ? attachFile.name : '클릭하여 파일 선택'}
                </div>
                {!attachFile && <div style={{ fontSize: 10, color: '#C4B8B0', marginTop: 3 }}>최대 20MB</div>}
              </div>
            )}
            {attachType === 'link' && (
              <input
                value={attachLink}
                onChange={e => setAttachLink(e.target.value)}
                placeholder="https://"
                style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent' }}
              />
            )}
            <input ref={fileInputRef} type="file"
              accept={attachType === 'image' ? 'image/*' : '*'}
              onChange={e => { const f = e.target.files?.[0]; if (f) setAttachFile(f); }}
              style={{ display: 'none' }} />
          </div>

          {/* 할일 구분 */}
          {category === '할일' && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>구분</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['work', 'personal'] as const).map(t => {
                  const labels = { work: '업무', personal: '개인' };
                  const activeColor = t === 'work' ? '#C17B6B' : '#9E8880';
                  return (
                    <button key={t} onClick={() => setTaskType(t)}
                      style={{ padding: '5px 14px', border: `1px solid ${taskType === t ? activeColor : '#EDE5DC'}`, background: taskType === t ? (t === 'work' ? '#FFF5F2' : '#F5F0EE') : '#fff', fontSize: 10, letterSpacing: '0.06em', color: taskType === t ? activeColor : '#9E8880', cursor: 'pointer' }}>
                      {labels[t]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 공개 범위 */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>보이는 범위</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['all', 'me', 'specific'] as const).map(v => {
                const labels = { all: '전체', me: '나만', specific: '특정인' };
                return (
                  <button key={v} onClick={() => setVisibility(v)}
                    style={{ padding: '5px 12px', border: `1px solid ${visibility === v ? '#2C1810' : '#EDE5DC'}`, background: visibility === v ? '#FDF8F4' : '#fff', fontSize: 10, letterSpacing: '0.06em', color: visibility === v ? '#2C1810' : '#9E8880', cursor: 'pointer' }}>
                    {labels[v]}
                  </button>
                );
              })}
            </div>
            {visibility === 'specific' && nonAdminUsers.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {nonAdminUsers.map(u => (
                  <button key={u.email} onClick={() => toggleUser(u.email)}
                    style={{ padding: '4px 10px', border: `1px solid ${selectedUsers.includes(u.email) ? '#C17B6B' : '#EDE5DC'}`, background: selectedUsers.includes(u.email) ? '#FFF5F2' : '#fff', fontSize: 10, color: selectedUsers.includes(u.email) ? '#C17B6B' : '#9E8880', cursor: 'pointer' }}>
                    {u.name || u.email}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => onClose()}
            style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>
            취소
          </button>
          <button onClick={handleSubmit} disabled={uploading}
            style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: uploading ? '#9E8880' : '#2C1810', color: '#FDF8F4', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer' }}>
            {uploading ? '업로드 중...' : '게시하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
