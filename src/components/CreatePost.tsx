'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePostStore } from '@/store/postStore';
import { useUserStore } from '@/store/userStore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface CreatePostProps {
  panelId: string;
  onClose: () => void;
  categories?: string[];
}

const BASE_CATEGORIES = ['공지', '메모', '첨부파일'];

export default function CreatePost({ panelId, onClose, categories }: CreatePostProps) {
  const { user } = useAuthStore();
  const { addPost } = usePostStore();
  const { users } = useUserStore();

  const [type, setType] = useState<'text' | 'image' | 'link' | 'file'>('text');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState<'all' | 'me' | 'specific'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allCategories = categories || BASE_CATEGORIES;
  const nonAdminUsers = users.filter(u => u.email !== user?.email && u.role !== 'admin');

  const toggleUser = (email: string) => {
    setSelectedUsers(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!content.trim() && type === 'text') return;
    if ((type === 'image' || type === 'file') && !file && !content.trim()) return;

    let finalContent = content.trim();

    if (file && (type === 'image' || type === 'file')) {
      setUploading(true);
      try {
        const storageRef = ref(storage, `uploads/${panelId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        finalContent = await getDownloadURL(storageRef);
      } catch (err) {
        console.error('Upload error:', err);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const visibleTo: string[] = [];
    if (visibility === 'me') {
      visibleTo.push(user.email!);
    } else if (visibility === 'specific') {
      visibleTo.push(...selectedUsers);
    }

    await addPost({
      panelId,
      type,
      content: finalContent,
      author: user.email!,
      category: category || '전체',
      visibleTo: visibility === 'all' ? [] : visibleTo,
    });

    onClose();
  };

  const typeCards = [
    { key: 'text', label: '텍스트', icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 5h12M4 9h12M4 13h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    )},
    { key: 'image', label: '이미지', icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M2 13l5-5 4 4 2-2 5 5" stroke="currentColor" strokeWidth="1.5"/></svg>
    )},
    { key: 'file', label: '파일', icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 2h7l4 4v12H5V2z" stroke="currentColor" strokeWidth="1.5"/><path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.5"/></svg>
    )},
    { key: 'link', label: '링크', icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M8 12s-2-2-2-4a4 4 0 018 0c0 2-2 4-2 4M12 8s2 2 2 4a4 4 0 01-8 0c0-2 2-4 2-4" stroke="currentColor" strokeWidth="1.5"/></svg>
    )},
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(44,20,16,0.4)' }}>
      <div className="w-full max-w-lg" style={{ background: '#fff', border: '1px solid #EDE5DC' }}>

        {/* 헤더 */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EDE5DC' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>
            새 게시물
          </span>
        </div>

        {/* 바디 */}
        <div style={{ padding: '20px 24px' }}>

          {/* 타입 선택 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>타입</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
              {typeCards.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setType(t.key as any); setFile(null); setContent(''); }}
                  style={{
                    border: `1px solid ${type === t.key ? '#C17B6B' : '#EDE5DC'}`,
                    background: type === t.key ? '#FDF8F4' : '#fff',
                    padding: '10px 6px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ color: type === t.key ? '#C17B6B' : '#9E8880', display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                    {t.icon}
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: type === t.key ? '#C17B6B' : '#9E8880' }}>
                    {t.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 카테고리 탭 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>카테고리</div>
            <div style={{ display: 'flex', borderBottom: '1px solid #EDE5DC' }}>
              {['전체', ...allCategories].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat === '전체' ? '' : cat)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: (category === '' && cat === '전체') || category === cat ? '#2C1810' : '#9E8880',
                    borderBottom: (category === '' && cat === '전체') || category === cat ? '1.5px solid #C17B6B' : '1.5px solid transparent',
                    marginBottom: -1,
                    background: 'none',
                    border: 'none',
                    borderBottomStyle: 'solid',
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 공개 범위 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>공개 범위</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['all', 'me', 'specific'] as const).map((v) => {
                const labels = { all: '전체 공개', me: '나만 보기', specific: '특정인' };
                return (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    style={{
                      padding: '5px 12px',
                      border: `1px solid ${visibility === v ? '#2C1810' : '#EDE5DC'}`,
                      background: visibility === v ? '#FDF8F4' : '#fff',
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: visibility === v ? '#2C1810' : '#9E8880',
                      cursor: 'pointer',
                    }}
                  >
                    {labels[v]}
                  </button>
                );
              })}
            </div>
            {visibility === 'specific' && nonAdminUsers.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {nonAdminUsers.map(u => (
                  <button
                    key={u.email}
                    onClick={() => toggleUser(u.email)}
                    style={{
                      padding: '4px 10px',
                      border: `1px solid ${selectedUsers.includes(u.email) ? '#C17B6B' : '#EDE5DC'}`,
                      background: selectedUsers.includes(u.email) ? '#FFF5F2' : '#fff',
                      fontSize: 10,
                      color: selectedUsers.includes(u.email) ? '#C17B6B' : '#9E8880',
                      cursor: 'pointer',
                    }}
                  >
                    {u.name || u.email}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 내용 입력 */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>내용</div>
            {(type === 'image' || type === 'file') ? (
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '1px dashed #EDE5DC',
                    padding: 24,
                    textAlign: 'center',
                    cursor: 'pointer',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 11, color: '#9E8880', letterSpacing: '0.04em' }}>
                    {file ? file.name : '파일을 클릭하거나 드래그해서 업로드'}
                  </div>
                  {!file && <div style={{ fontSize: 10, color: '#C4B8B0', marginTop: 3 }}>최대 20MB</div>}
                </div>
                <input ref={fileInputRef} type="file" accept={type === 'image' ? 'image/*' : '*'} onChange={handleFileChange} style={{ display: 'none' }} />
              </div>
            ) : type === 'link' ? (
              <input
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="https://"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1px solid #EDE5DC',
                  padding: '8px 0',
                  fontSize: 13,
                  color: '#2C1810',
                  outline: 'none',
                  background: 'transparent',
                }}
              />
            ) : (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="내용을 입력하세요..."
                rows={4}
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1px solid #EDE5DC',
                  padding: '8px 0',
                  fontSize: 13,
                  color: '#2C1810',
                  outline: 'none',
                  background: 'transparent',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
              />
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onClose}
            style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            취소
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {type === 'text' && (
              <span style={{ fontSize: 10, color: '#C4B8B0' }}>{content.length} / 500</span>
            )}
            <button
              onClick={handleSubmit}
              disabled={uploading}
              style={{
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '8px 20px',
                background: uploading ? '#9E8880' : '#2C1810',
                color: '#FDF8F4',
                border: 'none',
                cursor: uploading ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading ? '업로드 중...' : '게시하기'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
