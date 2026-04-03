'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePostStore } from '@/store/postStore';
import { useUserStore } from '@/store/userStore';
import { usePanelStore } from '@/store/panelStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
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
  const { panels } = usePanelStore();
  const { addRequest } = useTodoRequestStore();

  const allCategories = categories || BASE_CATEGORIES;

  const getInitialCategory = () => {
    if (!defaultCategory || defaultCategory === '전체') return allCategories[0] || '메모';
    if (allCategories.includes(defaultCategory)) return defaultCategory;
    return allCategories[0] || '메모';
  };

  const [category, setCategory] = useState(getInitialCategory());
  const [taskType, setTaskType] = useState<'work' | 'personal'>('work');
  // 할일/요청은 기본 'me', 나머지는 'all'
  const [visibility, setVisibility] = useState<'all' | 'me' | 'specific'>(
    getInitialCategory() === '할일' ? 'me' : 'all'
  );
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [attachType, setAttachType] = useState<'none' | 'image' | 'file' | 'link'>('none');
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachLink, setAttachLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 요청 전용 state
  const [requestTo, setRequestTo] = useState<string[]>([]);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestContent, setRequestContent] = useState('');
  const [requestDueDate, setRequestDueDate] = useState('');
  const [requestDueDateInput, setRequestDueDateInput] = useState('');
  const [requestVisibility, setRequestVisibility] = useState<'requestOnly' | 'all' | 'specific'>('requestOnly');
  const [requestSelectedUsers, setRequestSelectedUsers] = useState<string[]>([]);
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const myEmail = user?.email ?? '';
  const myPanel = panels.find(p => p.ownerEmail === myEmail);
  const otherUsers = users.filter(u => u.email !== myEmail && u.role !== 'admin');
  const nonAdminUsers = users.filter(u => u.email !== myEmail && u.role !== 'admin');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleUser = (email: string) => {
    setSelectedUsers(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  // yyyymmdd → yyyy-mm-dd 변환
  const parseDateInput = (val: string): string => {
    // yyyymmdd 형식
    const digits = val.replace(/\D/g, '');
    if (digits.length === 8) {
      return `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`;
    }
    // yyyy-mm-dd 형식 직접 입력
    if (val.match(/^\d{4}-\d{2}-\d{2}$/)) return val;
    return '';
  };

  const handleDueDateInput = (val: string) => {
    setRequestDueDateInput(val);
    const parsed = parseDateInput(val);
    if (parsed) setRequestDueDate(parsed);
    else setRequestDueDate('');
  };

  const handleCalendarDate = (val: string) => {
    setRequestDueDate(val);
    setRequestDueDateInput(val.replace(/-/g, ''));
  };

  const handleSubmit = async () => {
    if (!user) return;
    const hasAttachment = (attachType === 'image' || attachType === 'file') && attachFile
      || (attachType === 'link' && attachLink.trim());
    if (!content.trim() && !hasAttachment) return;

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

  const handleRequestSubmit = async () => {
    if (!requestTitle.trim() || requestTo.length === 0) return;
    if (!myPanel) return;
    setRequestSubmitting(true);
    try {
      const isTeam = requestTo.length > 1;
      const teamLabel = isTeam
        ? requestTo.map(email => users.find(u => u.email === email)?.name || email.split('@')[0]).join(', ')
        : null;

      for (const toEmail of requestTo) {
        const toPanel = panels.find(p => p.ownerEmail === toEmail);
        if (!toPanel) continue;

        let visibleTo: string[] = [];
        if (requestVisibility === 'requestOnly') visibleTo = [myEmail, ...requestTo];
        else if (requestVisibility === 'specific') visibleTo = [myEmail, ...requestTo, ...requestSelectedUsers];

        await addRequest({
          fromEmail: myEmail,
          fromPanelId: myPanel.id,
          toEmail,
          toPanelId: toPanel.id,
          title: requestTitle.trim(),
          content: requestContent.trim(),
          dueDate: requestDueDate || undefined,
          visibleTo,
          teamLabel: teamLabel || undefined,
        });
      }
      onClose();
    } catch (err) {
      console.error('요청 오류:', err);
    } finally {
      setRequestSubmitting(false);
    }
  };

  const attachIcons = {
    image: <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M2 13l5-5 4 4 2-2 5 5" stroke="currentColor" strokeWidth="1.5"/></svg>,
    file: <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 2h7l4 4v12H5V2z" stroke="currentColor" strokeWidth="1.5"/><path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.5"/></svg>,
    link: <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M8 12s-2-2-2-4a4 4 0 018 0c0 2-2 4-2 4M12 8s2 2 2 4a4 4 0 01-8 0c0-2 2-4 2-4" stroke="currentColor" strokeWidth="1.5"/></svg>,
  };

  const isRequest = category === '요청';

  const tabList = [...allCategories, '요청'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(44,20,16,0.4)' }}>
      <div className="w-full max-w-lg" style={{ background: '#fff', border: '1px solid #EDE5DC' }}>

        {/* 헤더 */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EDE5DC' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>새 게시물</span>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* 카테고리 탭 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>카테고리</div>
            <div style={{ display: 'flex', borderBottom: '1px solid #EDE5DC' }}>
              {tabList.map(cat => (
                <button key={cat}
                  onClick={() => {
                    setCategory(cat);
                    if (cat === '할일' || cat === '요청') setVisibility('me');
                    else setVisibility('all');
                  }}
                  style={{
                    padding: '6px 12px', fontSize: 10, letterSpacing: '0.08em',
                    color: category === cat ? (cat === '요청' ? '#C17B6B' : '#2C1810') : '#9E8880',
                    borderBottom: category === cat ? `1.5px solid ${cat === '요청' ? '#C17B6B' : '#2C1810'}` : '1.5px solid transparent',
                    marginBottom: -1, background: 'none', border: 'none',
                    borderBottomStyle: 'solid', cursor: 'pointer',
                  }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 요청 폼 */}
          {isRequest ? (
            <div>
              {/* 받는 사람 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880' }}>
                    받는 사람
                  </div>
                  {requestTo.length >= 2 && (
                    <span style={{ fontSize: 10, color: '#C17B6B', letterSpacing: '0.06em' }}>
                      팀 요청 ({requestTo.length}명)
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {otherUsers.map(u => {
                    const isSelected = requestTo.includes(u.email);
                    return (
                      <button key={u.email}
                        onClick={() => setRequestTo(prev =>
                          prev.includes(u.email)
                            ? prev.filter(e => e !== u.email)
                            : [...prev, u.email]
                        )}
                        style={{
                          padding: '5px 12px', fontSize: 10,
                          border: `1px solid ${isSelected ? '#2C1810' : '#EDE5DC'}`,
                          background: isSelected ? '#FDF8F4' : '#fff',
                          color: isSelected ? '#2C1810' : '#9E8880',
                          cursor: 'pointer',
                          position: 'relative',
                        }}>
                        {u.name || u.email}
                        {isSelected && (
                          <span style={{ marginLeft: 4, color: '#C17B6B', fontSize: 9 }}>✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 제목 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>무엇을</div>
                <input value={requestTitle} onChange={e => setRequestTitle(e.target.value)}
                  placeholder="요청 제목 (한 줄)"
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent' }} />
              </div>

              {/* 내용 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>왜 / 어떻게</div>
                <textarea value={requestContent} onChange={e => setRequestContent(e.target.value)}
                  placeholder="상세 내용 (선택)"
                  rows={3}
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit' }} />
              </div>

              {/* 기한 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880' }}>
                    언제까지 <span style={{ fontWeight: 400, color: '#C4B8B0' }}>(선택)</span>
                  </div>
                  {requestDueDate && (
                    <button onClick={() => { setRequestDueDate(''); setRequestDueDateInput(''); }}
                      style={{ fontSize: 10, color: '#C4B8B0', background: 'none', border: 'none', cursor: 'pointer' }}>
                      ✕ 초기화
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                  {requestDueDate && !requestDueDateInput.includes('-') ? (
                    <span
                      onClick={() => { setRequestDueDateInput(''); }}
                      style={{ fontSize: 13, color: '#2C1810', borderBottom: '1px solid #C17B6B', padding: '8px 0', cursor: 'text', flex: 1, letterSpacing: '0.02em' }}>
                      {new Date(requestDueDate + 'T00:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={requestDueDateInput}
                      onChange={e => handleDueDateInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && requestDueDate) {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      onBlur={() => {
                        if (!requestDueDate) setRequestDueDateInput('');
                      }}
                      placeholder="yyyy-mm-dd"
                      style={{ border: 'none', borderBottom: `1px solid ${requestDueDate ? '#C17B6B' : '#EDE5DC'}`, padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', flex: 1, letterSpacing: '0.04em' }}
                      autoFocus={!!requestDueDateInput}
                    />
                  )}
                  {/* 달력 아이콘 — 숨겨진 date input 트리거 */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" style={{ cursor: 'pointer', color: '#C4B8B0' }}>
                      <rect x="1" y="2" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M4 1v2M10 1v2M1 5h12" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                    <input
                      type="date"
                      value={requestDueDate}
                      onChange={e => { handleCalendarDate(e.target.value); setRequestDueDateInput(''); }}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                    />
                  </div>
                </div>
                {requestDueDate && (
                  <div style={{ fontSize: 10, color: '#C17B6B', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="2" width="12" height="11" rx="1" stroke="#C17B6B" strokeWidth="1.2"/>
                      <path d="M4 1v2M10 1v2M1 5h12" stroke="#C17B6B" strokeWidth="1.2"/>
                    </svg>
                    수락 시 달력에 자동 등록됩니다
                  </div>
                )}
              </div>

              {/* 공개 범위 */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>공개 범위</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {([
                    { v: 'requestOnly', label: '요청자+수신자' },
                    { v: 'all', label: '전체 공개' },
                    { v: 'specific', label: '특정인 추가' },
                  ] as const).map(({ v, label }) => (
                    <button key={v} onClick={() => setRequestVisibility(v)}
                      style={{ padding: '5px 12px', fontSize: 10, border: `1px solid ${requestVisibility === v ? '#2C1810' : '#EDE5DC'}`, background: requestVisibility === v ? '#FDF8F4' : '#fff', color: requestVisibility === v ? '#2C1810' : '#9E8880', cursor: 'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>
                {requestVisibility === 'specific' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {otherUsers.filter(u => !requestTo.includes(u.email)).map(u => (
                      <button key={u.email}
                        onClick={() => setRequestSelectedUsers(prev => prev.includes(u.email) ? prev.filter(e => e !== u.email) : [...prev, u.email])}
                        style={{ padding: '4px 10px', fontSize: 10, border: `1px solid ${requestSelectedUsers.includes(u.email) ? '#C17B6B' : '#EDE5DC'}`, background: requestSelectedUsers.includes(u.email) ? '#FFF5F2' : '#fff', color: requestSelectedUsers.includes(u.email) ? '#C17B6B' : '#9E8880', cursor: 'pointer' }}>
                        {u.name || u.email}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* 내용 */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>내용</div>
                <textarea value={content} onChange={e => setContent(e.target.value)}
                  placeholder="내용을 입력하세요..." rows={4}
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit' }} />
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
                        style={{ padding: '5px 10px', fontSize: 10, letterSpacing: '0.06em', border: `1px solid ${attachType === t ? '#C17B6B' : '#EDE5DC'}`, background: attachType === t ? '#FFF5F2' : '#fff', color: attachType === t ? '#C17B6B' : '#9E8880', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {t !== 'none' && attachIcons[t]}
                        {labels[t]}
                      </button>
                    );
                  })}
                </div>
                {(attachType === 'image' || attachType === 'file') && (
                  <div onClick={() => fileInputRef.current?.click()}
                    style={{ border: '1px dashed #EDE5DC', padding: 16, textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 11, color: '#9E8880' }}>
                      {attachFile ? attachFile.name : '클릭하여 파일 선택'}
                    </div>
                    {!attachFile && <div style={{ fontSize: 10, color: '#C4B8B0', marginTop: 3 }}>최대 20MB</div>}
                  </div>
                )}
                {attachType === 'link' && (
                  <input value={attachLink} onChange={e => setAttachLink(e.target.value)}
                    placeholder="https://"
                    style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent' }} />
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
            </>
          )}
        </div>

        {/* 푸터 */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => onClose()}
            style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>
            취소
          </button>
          {isRequest ? (
            <button onClick={handleRequestSubmit}
              disabled={requestSubmitting || !requestTitle.trim() || requestTo.length === 0}
              style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: (!requestTitle.trim() || requestTo.length === 0) ? '#C4B8B0' : '#2C1810', color: '#FDF8F4', border: 'none', cursor: (!requestTitle.trim() || requestTo.length === 0) ? 'not-allowed' : 'pointer' }}>
              {requestSubmitting ? '전송 중...' : '요청 보내기'}
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={uploading}
              style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: uploading ? '#9E8880' : '#2C1810', color: '#FDF8F4', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer' }}>
              {uploading ? '업로드 중...' : '게시하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
