'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Post, usePostStore } from '@/store/postStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import { useUserStore } from '@/store/userStore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import ImageViewer from '@/components/common/ImageViewer';
import { colors, tagColors } from '@/styles/tokens';
import { todoLeftBorderColor } from '@/lib/leftBorderColor';

interface TodoItemProps {
  post: Post;
  canEdit: boolean;
}

interface PostUpdates {
  content: string;
  taskType: 'work' | 'personal';
  visibleTo: string[];
  dueDate?: string;
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

  const [checking, setChecking] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTeamTooltip, setShowTeamTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [showSpecificTooltip, setShowSpecificTooltip] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - dragPos.x, y: e.clientY - dragPos.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
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
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isImageOpen) { setIsImageOpen(false); return; }
      if (showDetailModal) { setShowDetailModal(false); return; }
      if (showOrderModal) { setShowOrderModal(false); return; }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isImageOpen, showDetailModal, showOrderModal]);

  const isWork = post.taskType === 'work';
  const tagLabel = isWork ? '업무' : '개인';

  const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const handleCheck = async () => {
    if (!canEdit || checking || justChecked) return;
    setJustChecked(true);
    setChecking(true);
    setTimeout(async () => {
      try {
        await updatePost(post.id, { completed: true, completedAt: new Date() });
        if (post.requestId) await completeRequest(post.requestId);
      } catch (e) {
        console.error(e);
        const { useToastStore } = await import('@/store/toastStore');
        useToastStore.getState().addToast({ message: '완료 처리에 실패했습니다. 다시 시도해주세요.', type: 'error' });
      } finally {
        setChecking(false);
      }
    }, 600);
  };

  const handleComplete = async () => {
    if (!canEdit || isCompleting) return;
    setIsCompleting(true);
    try {
      await updatePost(post.id, { completed: true, completedAt: new Date() });
      if (post.requestId) await completeRequest(post.requestId);
      setShowOrderModal(false);
    } finally {
      setIsCompleting(false);
    }
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
      const { useToastStore } = await import('@/store/toastStore');
      useToastStore.getState().addToast({ message: '저장에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    }
  };

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

  const openDetailModal = () => {
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
    setIsEditingTitle(false);
    setShowDetailModal(true);
  };

  const handleItemClick = () => {
    if (!canEdit || justChecked) return;
    if (post.requestId) setShowOrderModal(true);
    else openDetailModal();
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
      const normalizedDue = detailDueDate.length === 8
        ? `${detailDueDate.slice(0, 4)}-${detailDueDate.slice(4, 6)}-${detailDueDate.slice(6, 8)}`
        : detailDueDate;
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
            await addDoc(collection(db, 'calendarEvents'), {
              title: detailTitle.trim(),
              startDate: normalizedDue,
              endDate: normalizedDue,
              authorId: user.uid,
              authorName: user.displayName || user.email,
              color,
              taskType: detailTaskType,
              visibility: detailVisibility,
              createdAt: serverTimestamp(),
            });
            useToastStore.getState().addToast({ message: '캘린더에 등록되었습니다.', type: 'success' });
          }
        }
      }

      setShowDetailModal(false);
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

  const renderContent = () => {
    if (post.attachment?.type === 'image') return (
      <>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: justChecked ? colors.textSecondary : colors.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 6 }}>{post.content}</div>
        <img
          src={post.attachment.url}
          alt="할일 이미지"
          style={{ maxWidth: '100%', height: 'auto', display: 'block', opacity: justChecked ? 0.5 : 1 }}
          onClick={e => { e.stopPropagation(); setIsImageOpen(true); }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </>
    );
    if (post.attachment?.type === 'file') return (
      <a
        href={post.attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{ fontSize: 12, color: colors.accent, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M3 1h6l3 3v9H3V1z" stroke="#C17B6B" strokeWidth="1.2"/>
          <path d="M8 1v3h3" stroke="#C17B6B" strokeWidth="1.2"/>
        </svg>
        {post.attachment.name || post.attachment.url.split('/').pop()?.split('?')[0] || '첨부파일'}
      </a>
    );
    if (post.attachment?.type === 'link') return (
      <a
        href={post.attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{ fontSize: 12, color: colors.accent, wordBreak: 'break-all' }}
      >
        {post.attachment.url}
      </a>
    );
    return post.content;
  };

  const normalizeDueDate = (s: string) =>
    s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s;

  const renderDueTag = (dueDateStr: string) => {
    const due = new Date(normalizeDueDate(dueDateStr) + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isUrgent = diffDays <= 3;
    const dueColor = isUrgent ? tagColors.dueSoon.fg : tagColors.dueLater.fg;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 8, padding: '2px 6px', background: isUrgent ? tagColors.dueSoon.bg : tagColors.dueLater.bg, color: dueColor, border: `1px solid ${dueColor}` }}>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke={dueColor} strokeWidth="1.2"/>
          <path d="M5 3v2.2l1.4 1" stroke={dueColor} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        {due.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
      </span>
    );
  };

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleItemClick}
        style={{
          cursor: canEdit && !justChecked ? 'pointer' : 'default',
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '10px 20px 10px 28px', margin: '0 -20px',
          borderBottom: `1px solid ${colors.border}`, position: 'relative',
          opacity: justChecked ? 0.4 : 1,
          transition: 'opacity 0.5s ease, transform 0.5s ease, background 0.15s ease',
          transform: justChecked ? 'translateX(8px)' : 'translateX(0)',
          background: isHovered && !justChecked ? colors.mainBg : colors.cardBg,
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: todoLeftBorderColor(post), pointerEvents: 'none' }} />

        {canEdit && (
          <button onClick={e => { e.stopPropagation(); handleCheck(); }} disabled={checking || justChecked}
            style={{ width: 16, height: 16, border: `1.5px solid ${justChecked ? colors.accent : colors.border}`, background: justChecked ? colors.accent : colors.cardBg, cursor: justChecked ? 'default' : 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', position: 'relative', zIndex: 2 }}>
            {justChecked && <CheckIcon />}
          </button>
        )}

        {canEdit && (
          <button onClick={e => { e.stopPropagation(); handleStar(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', transition: 'opacity 0.15s ease', opacity: post.starred ? 1 : 0.25, position: 'relative', zIndex: 2 }}
            onMouseEnter={e => { if (!post.starred) e.currentTarget.style.opacity = '0.6'; }}
            onMouseLeave={e => { if (!post.starred) e.currentTarget.style.opacity = '0.25'; }}>
            <StarIcon filled={!!post.starred} />
          </button>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, lineHeight: 1.5, textDecoration: justChecked ? 'line-through' : 'none', color: justChecked ? colors.textSecondary : colors.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-word', transition: 'all 0.15s ease' }}>
                {renderContent()}
              </div>
              {post.requestFrom && post.requestContent && (
                <div style={{ fontSize: 11, color: colors.textHint, marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.requestContent}</div>
              )}
            </div>
            {canEdit && !post.requestId && !justChecked && (
              <span onClick={e => { e.stopPropagation(); handleDelete(); }}
                style={{ cursor: 'pointer', flexShrink: 0, opacity: 0.2, transition: 'opacity 0.15s', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', marginTop: 2 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.2')}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M5 4V2.5h4V4M5.5 6v5M8.5 6v5M3 4l.7 7.5h6.6L11 4" stroke="#C17B6B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            {post.requestFrom ? (
              <span style={{ fontSize: 9, padding: '2px 7px', background: tagColors.category.request.bg, color: tagColors.category.request.fg, border: `1px solid ${tagColors.category.request.border}`, letterSpacing: '0.04em' }}>요청</span>
            ) : (
              <span style={{ fontSize: 9, padding: '2px 7px', background: post.taskType === 'personal' ? tagColors.category.personal.bg : tagColors.category.work.bg, color: post.taskType === 'personal' ? tagColors.category.personal.fg : tagColors.category.work.fg, border: `1px solid ${post.taskType === 'personal' ? tagColors.category.personal.fg : tagColors.category.work.fg}`, letterSpacing: '0.04em' }}>{tagLabel}</span>
            )}
            {!post.requestFrom && (() => {
              const v = post.visibleTo;
              const isAll = !v || v.length === 0;
              const isSpec = v && v.length > 1;
              const label = isAll ? '전체' : isSpec ? '특정' : '나만';
              const color = isAll ? tagColors.visibility.all.fg : isSpec ? tagColors.visibility.specific.fg : tagColors.visibility.meOnly.fg;
              const border = isAll ? `1px solid ${tagColors.visibility.all.border}` : isSpec ? `1px solid ${tagColors.visibility.specific.border}` : `1px solid ${tagColors.visibility.meOnly.border}`;
              return (
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  <span style={{ fontSize: 9, padding: '1px 6px', background: 'none', color, border, letterSpacing: '0.06em' }}
                    onMouseEnter={() => setShowSpecificTooltip(true)}
                    onMouseLeave={() => setShowSpecificTooltip(false)}>
                    {label}
                  </span>
                  {label === '특정' && showSpecificTooltip && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: colors.cardBg, border: `0.5px solid ${colors.border}`, padding: '6px 8px', zIndex: 50, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 240 }}>
                        {post.visibleTo.map(email => {
                          const u = users.find(u => u.email === email);
                          return <span key={email} style={{ fontSize: 9, padding: '2px 7px', background: tagColors.team.bg, color: colors.textSecondary, letterSpacing: '0.04em' }}>{u?.name || email.split('@')[0]}</span>;
                        })}
                      </div>
                    </div>
                  )}
                </span>
              );
            })()}
            {post.requestFrom && (
              <>
                <span style={{ fontSize: 9, padding: '2px 7px', background: tagColors.from.bg, color: tagColors.from.fg, letterSpacing: '0.04em' }}>
                  From {users.find(u => u.email === post.requestFrom)?.name || post.requestFrom?.split('@')[0]}
                </span>
                {post.visibleTo && post.visibleTo.length > 1 && (
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                    onMouseEnter={e => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setTooltipPos({ top: rect.bottom + 6, left: rect.left }); setShowTeamTooltip(true); }}
                    onMouseLeave={() => setShowTeamTooltip(false)}>
                    <span style={{ fontSize: 9, padding: '2px 7px', background: tagColors.team.bg, color: colors.textSecondary, letterSpacing: '0.04em', cursor: 'default' }}>TEAM</span>
                    {showTeamTooltip && typeof window !== 'undefined' && createPortal(
                      <div style={{ position: 'fixed', top: tooltipPos.top, left: tooltipPos.left, background: colors.cardBg, border: `0.5px solid ${colors.border}`, padding: '8px', zIndex: 9999, boxShadow: '0 4px 12px rgba(44,20,16,0.08)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 4 }}>
                          {post.visibleTo.map(email => {
                            const u = users.find(u => u.email === email);
                            return <span key={email} style={{ fontSize: 9, padding: '3px 8px', background: tagColors.team.bg, color: colors.textSecondary, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{u?.name || email.split('@')[0]}</span>;
                          })}
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                )}
              </>
            )}
            {(post.requestDueDate || post.dueDate) && renderDueTag(post.requestDueDate || post.dueDate!)}
            <span style={{ fontSize: 9, color: colors.textHint, marginLeft: 'auto' }}>{formatDate(post.createdAt)}</span>
            {justChecked && <span style={{ fontSize: 10, color: colors.accent, letterSpacing: '0.04em' }}>완료</span>}
          </div>
        </div>
      </div>

      {showDetailModal && !post.requestId && (
        <div style={{ position: 'fixed', inset: 0, background: colors.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowDetailModal(false)}>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 6, width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: colors.sidebarBg, padding: '14px 20px 12px', flexShrink: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(253,248,244,0.45)', textTransform: 'uppercase', marginBottom: 6 }}>할일</div>
              {isEditingTitle ? (
                <input value={detailTitle} onChange={e => setDetailTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={e => { if (e.key === 'Enter') setIsEditingTitle(false); }}
                  autoFocus
                  style={{ fontSize: 15, fontWeight: 700, color: colors.mainBg, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(253,248,244,0.4)', outline: 'none', width: '100%', fontFamily: 'inherit', padding: '2px 0' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: colors.mainBg, lineHeight: 1.4 }}>{detailTitle}</span>
                  {canEdit && (
                    <span onClick={() => setIsEditingTitle(true)}
                      style={{ opacity: 0.25, cursor: 'pointer', transition: 'opacity 0.15s ease', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.25')}>
                      <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                        <path d="M8.5 1.5l2 2L3 11H1v-2L8.5 1.5z" stroke="#FDF8F4" strokeWidth="1.2" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>
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
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'none', color: detailVisibility === 'all' ? tagColors.visibility.all.fg : detailVisibility === 'me' ? tagColors.visibility.meOnly.fg : tagColors.visibility.specific.fg, border: `1px solid ${detailVisibility === 'all' ? tagColors.visibility.all.border : detailVisibility === 'me' ? tagColors.visibility.meOnly.border : tagColors.visibility.specific.border}` }}>
                {detailVisibility === 'all' ? '전체' : detailVisibility === 'me' ? '나만' : '특정'}
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={tableRow(false)}>
                <div style={labelStyle}>내용</div>
                <textarea value={detailContent} onChange={e => setDetailContent(e.target.value)} rows={3}
                  style={{ flex: 1, border: 'none', fontSize: 13, color: colors.textPrimary, outline: 'none', background: 'transparent', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6 }} />
              </div>
              <div style={tableRow(true)}>
                <div style={labelStyle}>기한</div>
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
              </div>
              <div style={tableRow(false)}>
                <div style={labelStyle}>첨부</div>
                <div style={{ flex: 1 }}>{renderDetailAttachment()}</div>
                <input ref={detailFileInputRef} type="file" accept="*/*"
                  onClick={e => { (e.target as HTMLInputElement).value = ''; }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setDetailNewFile(f); setDetailRemoveAttachment(false); } }}
                  style={{ display: 'none' }} />
              </div>
              <div style={tableRow(true)}>
                <div style={labelStyle}>구분</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {(['work', 'personal'] as const).map(t => (
                    <div key={t} onClick={() => setDetailTaskType(t)} style={taskBtnStyle(t)}>{t === 'work' ? '업무' : '개인'}</div>
                  ))}
                </div>
              </div>
              <div style={{ ...tableRow(false), flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                  <div style={labelStyle}>범위</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {(['all', 'me', 'specific'] as const).map(v => (
                      <div key={v} onClick={() => setDetailVisibility(v)} style={visBtnStyle(v)}>{v === 'all' ? '전체' : v === 'me' ? '나만' : '특정'}</div>
                    ))}
                  </div>
                </div>
                {detailVisibility === 'specific' && (
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
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span onClick={() => setShowDetailModal(false)} style={{ fontSize: 12, color: colors.textSecondary, cursor: 'pointer', padding: '5px 2px' }}>닫기</span>
                <span onClick={async () => { await handleDelete(); setShowDetailModal(false); }}
                  style={{ fontSize: 12, color: colors.accent, border: `1px solid ${colors.accent}`, background: 'none', padding: '5px 12px', borderRadius: 3, cursor: 'pointer' }}>삭제</span>
              </div>
              <span onClick={!isSaving ? handleDetailSave : undefined}
                style={{ fontSize: 12, fontWeight: 700, padding: '6px 18px', borderRadius: 3, background: isSaving ? colors.textSecondary : colors.textPrimary, color: colors.mainBg, cursor: isSaving ? 'not-allowed' : 'pointer', transition: 'background 0.15s ease' }}>
                {isSaving ? '저장 중...' : '저장'}
              </span>
            </div>
          </div>
        </div>
      )}

      {showOrderModal && post.requestId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowOrderModal(false)}>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, width: '100%', maxWidth: 860, zIndex: 1001, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: colors.sidebarBg, padding: '20px 28px', flexShrink: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.mainBg, lineHeight: 1.4, marginBottom: 12 }}>{post.content}</div>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                {post.requestFrom && (
                  <div style={{ fontSize: 12, color: 'rgba(253,248,244,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="3" r="2" stroke="rgba(253,248,244,0.7)" strokeWidth="1.2"/><path d="M1 9c0-2 1.8-3 4-3s4 1 4 3" stroke="rgba(253,248,244,0.7)" strokeWidth="1.2"/></svg>
                    {users.find(u => u.email === post.requestFrom)?.name || post.requestFrom.split('@')[0]} → 나
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'rgba(253,248,244,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><rect x="1" y="1.5" width="8" height="7" rx="1" stroke="rgba(253,248,244,0.7)" strokeWidth="1.2"/><path d="M3 1v1.5M7 1v1.5M1 4h8" stroke="rgba(253,248,244,0.7)" strokeWidth="1.2"/></svg>
                  {formatDate(post.createdAt)} 등록
                </div>
                {(post.requestDueDate || post.dueDate) && (() => {
                  const dueDateStr = post.requestDueDate || post.dueDate!;
                  return (
                    <div style={{ fontSize: 12, color: tagColors.dueSoonLight, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                      <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#F4C0D1" strokeWidth="1.2"/><path d="M5 3v2.2l1.4 1" stroke="#F4C0D1" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      {new Date(dueDateStr + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} 까지
                    </div>
                  );
                })()}
              </div>
            </div>
            <div style={{ background: tagColors.from.bg, padding: '8px 28px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: tagColors.category.request.fg, display: 'inline-block' }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: tagColors.category.request.fg }}>진행중</span>
            </div>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 360 }}>
              <div style={{ width: 260, flexShrink: 0, borderRight: `1px solid ${colors.border}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
                {post.requestContent && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.textSecondary, marginBottom: 7 }}>상세 내용</div>
                    <div style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.requestContent}</div>
                  </div>
                )}
                <div style={{ height: '0.5px', background: colors.border }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: colors.textSecondary, width: 36, flexShrink: 0 }}>공개</span>
                    <span style={{ fontSize: 9, padding: '3px 8px', color: !post.visibleTo || post.visibleTo.length === 0 ? tagColors.visibility.all.fg : post.visibleTo.length > 1 ? tagColors.visibility.specific.fg : tagColors.visibility.meOnly.fg, border: !post.visibleTo || post.visibleTo.length === 0 ? `1px solid ${tagColors.visibility.all.border}` : post.visibleTo.length > 1 ? `1px solid ${tagColors.visibility.specific.border}` : `1px solid ${tagColors.visibility.meOnly.border}` }}>
                      {!post.visibleTo || post.visibleTo.length === 0 ? '전체' : post.visibleTo.length > 1 ? '특정' : '나만'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: colors.textSecondary, width: 36, flexShrink: 0 }}>구분</span>
                    <span style={{ fontSize: 9, padding: '3px 8px', background: post.taskType === 'personal' ? tagColors.category.personal.bg : tagColors.category.work.bg, color: post.taskType === 'personal' ? tagColors.category.personal.fg : tagColors.category.work.fg, border: `1px solid ${post.taskType === 'personal' ? tagColors.category.personal.fg : tagColors.category.work.fg}` }}>
                      {post.taskType === 'personal' ? '개인' : '업무'}
                    </span>
                  </div>
                </div>
                <div style={{ height: '0.5px', background: colors.border }} />
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.textSecondary, marginBottom: 7 }}>첨부파일</div>
                  {post.attachment ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: `0.5px solid ${colors.border}`, background: colors.cardBg }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1h6l3 3v9H3V1z" stroke="#C17B6B" strokeWidth="1.2"/><path d="M8 1v3h3" stroke="#C17B6B" strokeWidth="1.2"/></svg>
                        <span style={{ fontSize: 12, color: colors.textPrimary }}>{post.attachment.name || '첨부파일'}</span>
                      </div>
                      <a href={post.attachment.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: colors.accent, textDecoration: 'none' }}>열기</a>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: colors.textHint }}>없음</div>
                  )}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ textAlign: 'center', fontSize: 10, color: colors.textHint }}>댓글 기능은 준비 중입니다</div>
                </div>
                <div style={{ borderTop: `1px solid ${colors.border}`, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                  <input placeholder="메모를 남겨주세요..." disabled
                    style={{ flex: 1, border: 'none', borderBottom: `1px solid ${colors.border}`, fontSize: 12, color: colors.textPrimary, outline: 'none', background: 'transparent', padding: '5px 0', fontFamily: 'inherit', opacity: 0.4, cursor: 'not-allowed' }} />
                  <button disabled style={{ fontSize: 10, padding: '7px 16px', background: colors.border, color: colors.textSecondary, border: 'none', cursor: 'not-allowed' }}>전송</button>
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 28px', borderTop: `1px solid ${colors.border}`, background: colors.mainBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <button onClick={() => setShowOrderModal(false)} style={{ fontSize: 11, letterSpacing: '0.04em', color: colors.textSecondary, background: 'none', border: 'none', cursor: 'pointer' }}>닫기</button>
              <button onClick={handleComplete} disabled={isCompleting}
                style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '9px 24px', background: colors.textPrimary, color: colors.mainBg, border: 'none', cursor: isCompleting ? 'not-allowed' : 'pointer', opacity: isCompleting ? 0.6 : 1 }}>
                {isCompleting ? '처리 중...' : '완료 처리'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isImageOpen && post.attachment?.type === 'image' && (
        <ImageViewer
          url={post.attachment.url}
          onClose={() => setIsImageOpen(false)}
        />
      )}

    </>
  );
}
