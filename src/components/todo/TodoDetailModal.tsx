'use client';

import { useRef, useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Post, usePostStore } from '@/store/postStore';
import { useUserStore } from '@/store/userStore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { colors, tagColors } from '@/styles/tokens';

interface PostUpdates {
  content: string;
  taskType: 'work' | 'personal';
  visibleTo: string[];
  dueDate?: string;
  attachment?: { type: 'image' | 'file' | 'link'; url: string; name?: string };
}

interface TodoDetailModalProps {
  post: Post;
  canEdit: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function TodoDetailModal({ post, canEdit, isOpen, onClose }: TodoDetailModalProps) {
  const { updatePost, deletePost } = usePostStore();
  const { users } = useUserStore();
  const nonAdminUsers = users.filter(u => u.role !== 'admin' && u.email !== post.author);

  const [isReadMode, setIsReadMode] = useState(true);
  const [detailTitle, setDetailTitle] = useState(post.content);
  const [detailContent, setDetailContent] = useState(post.content);
  const [detailTaskType, setDetailTaskType] = useState<'work' | 'personal'>(post.taskType || 'work');
  const [detailVisibility, setDetailVisibility] = useState<'all' | 'me' | 'specific'>(
    !post.visibleTo || post.visibleTo.length === 0 ? 'all'
      : post.visibleTo.length === 1 && post.visibleTo[0] === post.author ? 'me'
      : 'specific'
  );
  const [detailSpecificUsers, setDetailSpecificUsers] = useState<string[]>(
    post.visibleTo?.filter(e => e !== post.author) ?? []
  );
  const [detailDueDate, setDetailDueDate] = useState(post.dueDate ?? '');
  const [detailAddToCalendar, setDetailAddToCalendar] = useState(false);
  const [detailNewFile, setDetailNewFile] = useState<File | null>(null);
  const [detailRemoveAttachment, setDetailRemoveAttachment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const detailFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDetailTitle(post.content);
      setDetailContent(post.content);
      setDetailTaskType(post.taskType || 'work');
      setDetailVisibility(
        !post.visibleTo || post.visibleTo.length === 0 ? 'all'
          : post.visibleTo.length === 1 && post.visibleTo[0] === post.author ? 'me'
          : 'specific'
      );
      setDetailSpecificUsers(post.visibleTo?.filter(e => e !== post.author) ?? []);
      setDetailDueDate(post.dueDate ?? '');
      setDetailAddToCalendar(false);
      setDetailNewFile(null);
      setDetailRemoveAttachment(false);
      setIsReadMode(true);
    }
  }, [isOpen, post]);

  const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const normalizeDue = (s: string) =>
    s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s;

  const handleDelete = async () => {
    if (!canEdit) return;
    try {
      await deletePost(post.id);
    } catch (e) {
      console.error(e);
      const { useToastStore } = await import('@/store/toastStore');
      useToastStore.getState().addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    }
  };

  const handleDetailSave = async () => {
    if (!detailTitle.trim()) return;
    setIsSaving(true);
    try {
      let attachmentUpdate: Record<string, unknown> = {};

      if (detailRemoveAttachment) {
        const { doc, updateDoc, deleteField } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        await updateDoc(doc(db, 'posts', post.id), { attachment: deleteField() });
      } else if (detailNewFile && post.attachment && (post.attachment.type === 'image' || post.attachment.type === 'file')) {
        const storageRef = ref(storage, `uploads/${post.panelId}/${Date.now()}_${detailNewFile.name}`);
        await uploadBytes(storageRef, detailNewFile);
        const url = await getDownloadURL(storageRef);
        attachmentUpdate = { attachment: { type: post.attachment.type, url, name: detailNewFile.name } };
      } else if (detailNewFile && !post.attachment) {
        const fileType = detailNewFile.type.startsWith('image/') ? 'image' : 'file';
        const storageRef = ref(storage, `uploads/${post.panelId}/${Date.now()}_${detailNewFile.name}`);
        await uploadBytes(storageRef, detailNewFile);
        const url = await getDownloadURL(storageRef);
        attachmentUpdate = { attachment: { type: fileType, url, name: detailNewFile.name } };
      } else if (post.attachment) {
        attachmentUpdate = { attachment: post.attachment };
      }

      const visibleTo = detailVisibility === 'all' ? []
        : detailVisibility === 'specific' ? [post.author, ...detailSpecificUsers.filter(e => e !== post.author)]
        : [post.author];

      const updates: PostUpdates = {
        content: detailTitle.trim(),
        taskType: detailTaskType,
        visibleTo,
        ...attachmentUpdate,
      };
      const normalizedDue = normalizeDue(detailDueDate);
      if (normalizedDue) updates.dueDate = normalizedDue;

      await updatePost(post.id, updates);

      if (detailAddToCalendar && normalizedDue) {
        const { addDoc, collection, getDocs, query, where, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const { useAuthStore } = await import('@/store/authStore');
        const { useToastStore } = await import('@/store/toastStore');
        const { user } = useAuthStore.getState();
        if (user) {
          const dupQuery = query(
            collection(db, 'calendarEvents'),
            where('authorId', '==', user.uid),
            where('startDate', '==', normalizedDue),
            where('title', '==', detailTitle.trim())
          );
          const dupSnap = await getDocs(dupQuery);
          if (!dupSnap.empty) {
            useToastStore.getState().addToast({ message: '동일한 일정이 캘린더에 이미 등록되어 있습니다.', type: 'error' });
          } else {
            const color = detailTaskType === 'personal'
              ? (detailVisibility === 'all' ? 'rgba(99,153,34,0.15)' : detailVisibility === 'me' ? 'rgba(55,138,221,0.15)' : 'rgba(186,117,23,0.15)')
              : (detailVisibility === 'all' ? tagColors.visibility.all.fg : detailVisibility === 'me' ? tagColors.visibility.meOnly.fg : tagColors.visibility.specific.fg);
            // #18 2단계 — uid/email 병기 + updatedAt + specific visibleTo 저장.
            await addDoc(collection(db, 'calendarEvents'), {
              title: detailTitle.trim(),
              startDate: normalizedDue,
              endDate: normalizedDue,
              authorId: user.uid,
              authorEmail: user.email,
              authorName: user.displayName || user.email,
              color,
              taskType: detailTaskType,
              visibility: detailVisibility,
              ...(detailVisibility === 'specific' && visibleTo ? { visibleTo } : {}),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            useToastStore.getState().addToast({ message: '캘린더에 등록되었습니다.', type: 'success' });
          }
        }
      }

      setIsReadMode(true);
    } catch (e) {
      console.error(e);
      const { useToastStore } = await import('@/store/toastStore');
      useToastStore.getState().addToast({ message: '저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const tableRow = (isAlt: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'flex-start',
    padding: '10px 20px',
    background: isAlt ? colors.altRowBg : colors.cardBg,
    borderBottom: `1px solid ${colors.border}`,
    gap: 12,
  });

  const labelStyle: React.CSSProperties = {
    width: 52, flexShrink: 0,
    fontSize: 10, fontWeight: 700,
    letterSpacing: '0.06em', color: colors.textHint,
    textTransform: 'uppercase', paddingTop: 2,
  };

  const taskBtnStyle = (t: 'work' | 'personal'): React.CSSProperties => {
    const isOn = detailTaskType === t;
    if (t === 'work') return { fontSize: 11, padding: '5px 13px', borderRadius: 3, cursor: 'pointer', border: `1px solid ${isOn ? tagColors.category.work.border : 'rgba(193,123,107,0.35)'}`, color: isOn ? tagColors.category.work.fg : 'rgba(193,123,107,0.45)', background: isOn ? tagColors.category.work.bg : 'transparent', transition: 'all 0.15s ease' };
    return { fontSize: 11, padding: '5px 13px', borderRadius: 3, cursor: 'pointer', border: `1px solid ${isOn ? tagColors.category.personal.border : 'rgba(123,94,167,0.35)'}`, color: isOn ? tagColors.category.personal.fg : 'rgba(123,94,167,0.45)', background: isOn ? tagColors.category.personal.bg : 'transparent', transition: 'all 0.15s ease' };
  };

  const visBtnStyle = (v: 'all' | 'me' | 'specific'): React.CSSProperties => {
    const isOn = detailVisibility === v;
    const map = {
      all:      { on: tagColors.visibility.all.fg, border: tagColors.visibility.all.border, offC: 'rgba(59,109,17,0.45)',  offB: 'rgba(99,153,34,0.35)' },
      me:       { on: tagColors.visibility.meOnly.fg, border: tagColors.visibility.meOnly.border, offC: 'rgba(24,95,165,0.45)',  offB: 'rgba(55,138,221,0.35)' },
      specific: { on: tagColors.visibility.specific.fg, border: tagColors.visibility.specific.border, offC: 'rgba(133,79,11,0.45)', offB: 'rgba(186,117,23,0.35)' },
    };
    const c = map[v];
    return { fontSize: 11, padding: '5px 13px', borderRadius: 3, cursor: 'pointer', border: `1px solid ${isOn ? c.border : c.offB}`, color: isOn ? c.on : c.offC, background: 'none', transition: 'all 0.15s ease' };
  };

  const renderDetailAttachment = () => {
    if (detailRemoveAttachment) return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: colors.textHint, flex: 1 }}>삭제 예정</span>
        <span onClick={() => setDetailRemoveAttachment(false)} style={{ fontSize: 10, color: colors.accent, cursor: 'pointer', border: `1px solid ${colors.accent}`, padding: '1px 7px', borderRadius: 2 }}>취소</span>
      </div>
    );
    if (post.attachment && !detailNewFile) return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 12, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.attachment.name || '첨부파일'}</span>
        <a href={post.attachment.url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 10, color: tagColors.visibility.meOnly.fg, border: `1px solid ${tagColors.visibility.meOnly.border}`, padding: '1px 7px', borderRadius: 2, cursor: 'pointer', textDecoration: 'none', flexShrink: 0 }}>열기</a>
        <span onClick={() => setDetailRemoveAttachment(true)} style={{ fontSize: 10, color: colors.accent, border: `1px solid ${colors.accent}`, padding: '1px 7px', borderRadius: 2, cursor: 'pointer', flexShrink: 0 }}>삭제</span>
      </div>
    );
    if (detailNewFile) return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 12, color: colors.accent }}>{detailNewFile.name}</span>
        <span onClick={() => setDetailNewFile(null)} style={{ fontSize: 10, color: colors.textSecondary, cursor: 'pointer' }}>취소</span>
      </div>
    );
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: colors.textHint, flex: 1 }}>없음</span>
        <span onClick={() => detailFileInputRef.current?.click()} style={{ fontSize: 10, color: colors.accent, border: `1px solid ${colors.accent}`, padding: '1px 7px', borderRadius: 2, cursor: 'pointer' }}>+ 추가</span>
      </div>
    );
  };

  const visLabel = detailVisibility === 'all' ? '전체' : detailVisibility === 'me' ? '나만' : '특정';
  const visColor = detailVisibility === 'all' ? tagColors.visibility.all : detailVisibility === 'me' ? tagColors.visibility.meOnly : tagColors.visibility.specific;

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay style={{ position: 'fixed', inset: 0, background: colors.overlay, zIndex: 1000 }} />
        <Dialog.Content style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 6, width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 1001 }}>
          <VisuallyHidden.Root><Dialog.Description>할일 상세 모달</Dialog.Description></VisuallyHidden.Root>
          <div style={{ background: colors.sidebarBg, padding: '14px 20px 12px', flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(253,248,244,0.45)', textTransform: 'uppercase', marginBottom: 6 }}>할일</div>
            {isReadMode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Dialog.Title style={{ fontSize: 15, fontWeight: 700, color: colors.mainBg, lineHeight: 1.4, margin: 0 }}>{detailTitle}</Dialog.Title>
                {canEdit && (
                  <span onClick={() => setIsReadMode(false)}
                    style={{ opacity: 0.25, cursor: 'pointer', transition: 'opacity 0.15s ease', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.25')}>
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                      <path d="M8.5 1.5l2 2L3 11H1v-2L8.5 1.5z" stroke="#FDF8F4" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </div>
            ) : (
              <>
                <VisuallyHidden.Root><Dialog.Title>할일 편집</Dialog.Title></VisuallyHidden.Root>
                <input value={detailTitle} onChange={e => setDetailTitle(e.target.value)}
                  autoFocus
                  style={{ fontSize: 15, fontWeight: 700, color: colors.mainBg, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(253,248,244,0.4)', outline: 'none', width: '100%', fontFamily: 'inherit', padding: '2px 0' }} />
              </>
            )}
            <div style={{ fontSize: 10, color: 'rgba(253,248,244,0.45)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5 }}>
                <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="#FDF8F4" strokeWidth="1"/>
                <path d="M1 5h10M4 1v2M8 1v2" stroke="#FDF8F4" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              {formatDate(post.createdAt)}
            </div>
          </div>
          <div style={{ background: colors.mainBg, borderBottom: `1px solid ${colors.border}`, padding: '7px 20px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: colors.textSecondary, paddingRight: 10, borderRight: `1px solid ${colors.divider}`, marginRight: 10 }}>할일</span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: detailTaskType === 'personal' ? tagColors.category.personal.bg : tagColors.category.work.bg, color: detailTaskType === 'personal' ? tagColors.category.personal.fg : tagColors.category.work.fg, border: `1px solid ${detailTaskType === 'personal' ? tagColors.category.personal.fg : tagColors.category.work.fg}`, marginRight: 4 }}>
              {detailTaskType === 'work' ? '업무' : '개인'}
            </span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'none', color: visColor.fg, border: `1px solid ${visColor.border}` }}>
              {visLabel}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={tableRow(false)}>
              <div style={labelStyle}>내용</div>
              {isReadMode ? (
                <div style={{ flex: 1, fontSize: 13, color: colors.textPrimary, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{detailContent || post.content}</div>
              ) : (
                <textarea value={detailContent} onChange={e => setDetailContent(e.target.value)} rows={3}
                  style={{ flex: 1, border: 'none', fontSize: 13, color: colors.textPrimary, outline: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6 }} />
              )}
            </div>
            <div style={tableRow(true)}>
              <div style={labelStyle}>기한</div>
              {isReadMode ? (
                <div style={{ flex: 1, fontSize: 13, color: detailDueDate ? colors.textPrimary : colors.textHint }}>
                  {detailDueDate ? normalizeDue(detailDueDate) : '없음'}
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="text" maxLength={8} placeholder="YYYYMMDD" value={detailDueDate}
                    onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 8); setDetailDueDate(v); if (v.length < 8) setDetailAddToCalendar(false); }}
                    style={{ width: 100, border: 'none', borderBottom: `1px solid ${colors.border}`, fontSize: 13, color: colors.textPrimary, outline: 'none', background: 'transparent', fontFamily: 'inherit', padding: '2px 0' }} />
                  <span style={{ color: colors.textHint, display: 'flex', alignItems: 'center', transition: 'color 0.15s ease', cursor: detailDueDate.length === 8 ? 'pointer' : 'default' }}
                    onMouseEnter={e => { if (detailDueDate.length === 8) (e.currentTarget as HTMLElement).style.color = colors.accent; }}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = colors.textHint}>
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                      <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1"/>
                      <path d="M1 5h10M4 1v2M8 1v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: detailDueDate.length === 8 ? colors.textSecondary : colors.textHint, cursor: detailDueDate.length === 8 ? 'pointer' : 'not-allowed' }}>
                    <input type="checkbox" checked={detailAddToCalendar} disabled={detailDueDate.length < 8}
                      onChange={e => setDetailAddToCalendar(e.target.checked)}
                      style={{ accentColor: colors.accent, cursor: detailDueDate.length === 8 ? 'pointer' : 'not-allowed' }} />
                    캘린더 등록
                  </label>
                </div>
              )}
            </div>
            <div style={tableRow(false)}>
              <div style={labelStyle}>첨부</div>
              <div style={{ flex: 1 }}>
                {isReadMode ? (
                  post.attachment ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ flex: 1, fontSize: 12, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.attachment.name || '첨부파일'}</span>
                      <a href={post.attachment.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 10, color: tagColors.visibility.meOnly.fg, border: `1px solid ${tagColors.visibility.meOnly.border}`, padding: '1px 7px', borderRadius: 2, cursor: 'pointer', textDecoration: 'none', flexShrink: 0 }}>열기</a>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: colors.textHint }}>없음</span>
                  )
                ) : renderDetailAttachment()}
              </div>
              {!isReadMode && (
                <input ref={detailFileInputRef} type="file" accept="*/*"
                  onClick={e => { (e.target as HTMLInputElement).value = ''; }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setDetailNewFile(f); setDetailRemoveAttachment(false); } }}
                  style={{ display: 'none' }} />
              )}
            </div>
            <div style={tableRow(true)}>
              <div style={labelStyle}>구분</div>
              {isReadMode ? (
                <span style={{ fontSize: 11, padding: '5px 13px', borderRadius: 3, background: detailTaskType === 'work' ? tagColors.category.work.bg : tagColors.category.personal.bg, color: detailTaskType === 'work' ? tagColors.category.work.fg : tagColors.category.personal.fg, border: `1px solid ${detailTaskType === 'work' ? tagColors.category.work.border : tagColors.category.personal.border}` }}>
                  {detailTaskType === 'work' ? '업무' : '개인'}
                </span>
              ) : (
                <div style={{ display: 'flex', gap: 5 }}>
                  {(['work', 'personal'] as const).map(t => (
                    <div key={t} onClick={() => setDetailTaskType(t)} style={taskBtnStyle(t)}>{t === 'work' ? '업무' : '개인'}</div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ ...tableRow(false), flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                <div style={labelStyle}>범위</div>
                {isReadMode ? (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, padding: '5px 13px', borderRadius: 3, color: visColor.fg, border: `1px solid ${visColor.border}` }}>
                      {visLabel}
                    </span>
                    {detailVisibility === 'specific' && detailSpecificUsers.length > 0 && (
                      <span style={{ fontSize: 11, color: colors.textSecondary }}>
                        ({detailSpecificUsers.map(e => users.find(u => u.email === e)?.name || e.split('@')[0]).join(', ')})
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {(['all', 'me', 'specific'] as const).map(v => (
                      <div key={v} onClick={() => setDetailVisibility(v)} style={visBtnStyle(v)}>{v === 'all' ? '전체' : v === 'me' ? '나만' : '특정'}</div>
                    ))}
                  </div>
                )}
              </div>
              {!isReadMode && detailVisibility === 'specific' && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', paddingLeft: 64 }}>
                  {nonAdminUsers.map(u => {
                    const sel = detailSpecificUsers.includes(u.email);
                    return (
                      <div key={u.email}
                        onClick={() => setDetailSpecificUsers(prev => sel ? prev.filter(e => e !== u.email) : [...prev, u.email])}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', border: sel ? `1px solid ${tagColors.visibility.specific.border}` : '1px solid rgba(186,117,23,0.32)', color: sel ? tagColors.visibility.specific.fg : 'rgba(133,79,11,0.42)', background: sel ? 'rgba(186,117,23,0.07)' : 'none' }}>
                        {u.name || u.email.split('@')[0]}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div style={{ background: colors.mainBg, borderTop: `1px solid ${colors.border}`, padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            {isReadMode ? (
              <span onClick={onClose} style={{ fontSize: 12, color: colors.textSecondary, cursor: 'pointer', padding: '5px 2px' }}>닫기</span>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span onClick={onClose} style={{ fontSize: 12, color: colors.textSecondary, cursor: 'pointer', padding: '5px 2px' }}>닫기</span>
                <span onClick={async () => { await handleDelete(); onClose(); }}
                  style={{ fontSize: 12, color: colors.accent, border: `1px solid ${colors.accent}`, background: 'none', padding: '5px 12px', borderRadius: 3, cursor: 'pointer' }}>삭제</span>
              </div>
            )}
            {!isReadMode && (
              <span onClick={!isSaving ? handleDetailSave : undefined}
                style={{ fontSize: 12, fontWeight: 700, padding: '6px 18px', borderRadius: 3, background: isSaving ? colors.textSecondary : colors.textPrimary, color: colors.mainBg, cursor: isSaving ? 'not-allowed' : 'pointer', transition: 'background 0.15s ease' }}>
                {isSaving ? '저장 중...' : '저장'}
              </span>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
