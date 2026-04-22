'use client';

import { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { TodoRequest, useTodoRequestStore, type ActorInfo } from '@/store/todoRequestStore';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { colors, tagColors } from '@/styles/tokens';

interface Comment {
  id: string;
  requestId: string;
  author: string;
  authorName: string;
  content: string;
  createdAt: Date;
  type: 'user' | 'system';
  event?: string;
  eventMeta?: { reason?: string };
}

const EVENT_LABEL: Record<string, string> = {
  accepted: '수락',
  rejected: '반려',
  completed: '완료 처리',
  reactivated: '완료 취소',
  cancel_requested: '취소 요청',
  cancel_approved: '취소 승인',
  cancel_denied: '취소 거부',
  cancel_withdrawn: '취소 요청 철회',
  cancelled: '취소',
};

const EVENT_ICON: Record<string, { bg: string; fg: string; symbol: string }> = {
  accepted: { bg: '#EAF3DE', fg: '#3B6D11', symbol: '✓' },
  rejected: { bg: '#FBEAF0', fg: '#993556', symbol: '✕' },
  completed: { bg: '#EAF3DE', fg: '#3B6D11', symbol: '✓' },
  reactivated: { bg: '#FAEEDA', fg: '#854F0B', symbol: '↩' },
  cancel_requested: { bg: '#FAEEDA', fg: '#854F0B', symbol: '↩' },
  cancel_approved: { bg: '#FBEAF0', fg: '#993556', symbol: '✕' },
  cancel_denied: { bg: '#EAF3DE', fg: '#3B6D11', symbol: '✓' },
  cancel_withdrawn: { bg: '#FAEEDA', fg: '#854F0B', symbol: '↩' },
  cancelled: { bg: '#F5F0EE', fg: '#9E8880', symbol: '✕' },
};

const STATUS_LABEL: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: '대기', bg: '#FBEAF0', fg: '#993556' },
  accepted: { label: '수락됨', bg: '#EAF3DE', fg: '#3B6D11' },
  cancel_requested: { label: '취소 대기', bg: '#FAEEDA', fg: '#854F0B' },
  completed: { label: '완료', bg: '#F0F5F0', fg: '#5C7A5C' },
  rejected: { label: '반려', bg: '#FBEAF0', fg: '#993556' },
  cancelled: { label: '취소됨', bg: '#F5F0EE', fg: '#9E8880' },
};

interface Props {
  request: TodoRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestDetailPopup({ request, isOpen, onClose }: Props) {
  const { users } = useUserStore();
  const currentUser = useAuthStore(s => s.user);
  const { updateRequest, requestCancel, withdrawCancelRequest, approveCancellation, denyCancellation } = useTodoRequestStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // 모바일 분기 — 768px 미만 시 1단 세로 스택
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 편집 모드
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  const nameOf = (email: string) => users.find(u => u.email === email)?.name || email;

  const isRequester = request?.fromEmail === currentUser?.email;
  const isAssignee = request?.toEmail === currentUser?.email;
  const canEdit = isRequester && request?.status === 'pending';

  const actor: ActorInfo = {
    email: currentUser?.email || '',
    name: currentUser?.displayName || currentUser?.email?.split('@')[0] || '',
  };

  const handleRequestCancel = async () => {
    if (!request || isActioning) return;
    setIsActioning(true);
    try {
      await requestCancel(request.id, actor);
      setShowCancelConfirm(false);
    } catch { /* store handles toast */ } finally {
      setIsActioning(false);
    }
  };

  const handleWithdrawCancel = async () => {
    if (!request || isActioning) return;
    setIsActioning(true);
    try {
      await withdrawCancelRequest(request.id, actor);
    } catch { /* store handles toast */ } finally {
      setIsActioning(false);
    }
  };

  const handleApproveCancellation = async () => {
    if (!request || isActioning) return;
    setIsActioning(true);
    try {
      await approveCancellation(request.id, actor);
    } catch { /* store handles toast */ } finally {
      setIsActioning(false);
    }
  };

  const handleDenyCancellation = async () => {
    if (!request || isActioning) return;
    setIsActioning(true);
    try {
      await denyCancellation(request.id, actor);
    } catch { /* store handles toast */ } finally {
      setIsActioning(false);
    }
  };

  // 편집 모드 진입 시 현재 값으로 초기화
  const enterEditMode = () => {
    if (!request) return;
    setEditTitle(request.title);
    setEditContent(request.content);
    setEditDueDate(request.dueDate || '');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!request || isSaving) return;
    setIsSaving(true);
    try {
      await updateRequest(request.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        dueDate: editDueDate || undefined,
      });
      useToastStore.getState().addToast({ message: '수정되었습니다', type: 'success' });
      setIsEditing(false);
    } catch {
      // store에서 이미 에러 토스트 처리
    } finally {
      setIsSaving(false);
    }
  };

  // 팝업 닫힐 때 편집 모드 리셋
  useEffect(() => {
    if (!isOpen) setIsEditing(false);
  }, [isOpen]);

  // seenAt 갱신: 팝업 열릴 때
  useEffect(() => {
    if (!isOpen || !request || !currentUser?.email) return;
    updateDoc(doc(db, 'todoRequests', request.id), {
      [`seenAt.${currentUser.email}`]: serverTimestamp(),
    }).catch(e => console.warn('seenAt update failed:', e));
  }, [isOpen, request?.id, currentUser?.email]);

  useEffect(() => {
    if (!isOpen || !request) return;
    const q = query(
      collection(db, 'comments'),
      where('requestId', '==', request.id),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          requestId: data.requestId,
          author: data.author,
          authorName: data.authorName,
          content: data.content,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          type: data.type || 'user',
          event: data.event || undefined,
          eventMeta: data.eventMeta || undefined,
        };
      }));
    });
    return () => unsubscribe();
  }, [isOpen, request?.id]);

  useEffect(() => {
    if (comments.length > 0) commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  if (!request) return null;

  const status = STATUS_LABEL[request.status] || STATUS_LABEL.pending;

  const formatDate = (d: Date | string | undefined) => {
    if (!d) return '-';
    const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const formatTime = (d: Date) => d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });

  const handleSendComment = async () => {
    if (!commentInput.trim() || isSending || !currentUser || !request) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, 'comments'), {
        requestId: request.id,
        author: currentUser.email,
        authorName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
        content: commentInput.trim(),
        type: 'user',
        createdAt: serverTimestamp(),
      });
      setCommentInput('');
    } catch (e) {
      console.error(e);
      useToastStore.getState().addToast({ message: '댓글 전송에 실패했습니다.', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'comments', id));
    } catch (e) {
      console.error(e);
      useToastStore.getState().addToast({ message: '댓글 삭제에 실패했습니다.', type: 'error' });
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC',
    fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent',
    padding: '6px 0', fontFamily: 'inherit',
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', zIndex: 1000 }} />
        <Dialog.Content style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: '#fff', border: `1px solid ${colors.border}`,
          width: '100%', maxWidth: 860, maxHeight: '80vh',
          display: 'flex', flexDirection: 'column', zIndex: 1001, borderRadius: 4,
        }}>
          <VisuallyHidden.Root><Dialog.Description>요청 상세</Dialog.Description></VisuallyHidden.Root>

          {/* 헤더 */}
          <div style={{ background: '#5C1F1F', padding: '20px 24px', borderRadius: '4px 4px 0 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              {isEditing ? (
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  style={{ ...inputStyle, fontSize: 18, fontWeight: 700, color: '#FDF8F4', borderBottomColor: 'rgba(253,248,244,0.3)' }}
                  data-testid="edit-title"
                />
              ) : (
                <Dialog.Title style={{ fontSize: 18, fontWeight: 700, color: '#FDF8F4', margin: 0, lineHeight: 1.4 }}>
                  {request.title}
                </Dialog.Title>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 3,
                  background: status.bg, color: status.fg,
                }}>
                  {status.label}
                </span>
                {canEdit && !isEditing && (
                  <button onClick={enterEditMode} data-testid="edit-button"
                    style={{ fontSize: 10, color: 'rgba(253,248,244,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FDF8F4')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(253,248,244,0.6)')}>
                    ✏️ 수정
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 태그 행 */}
          <div style={{ padding: '10px 24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 2, background: '#FBEAF0', color: '#993556' }}>요청</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 2, background: '#FCEEE9', color: '#A0503A' }}>From {nameOf(request.fromEmail)}</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 2, background: '#FCEEE9', color: '#A0503A' }}>To {nameOf(request.toEmail)}</span>
            {request.teamLabel && (
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 2, background: '#F5F0EE', color: '#9E8880' }}>TEAM</span>
            )}
            {isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#993556' }}>⏱</span>
                <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
                  data-testid="edit-duedate"
                  style={{ fontSize: 10, border: 'none', borderBottom: '1px solid #EDE5DC', outline: 'none', background: 'transparent', color: '#993556', fontFamily: 'inherit' }} />
              </div>
            ) : request.dueDate ? (
              <span style={{ fontSize: 10, color: '#993556', fontWeight: 600 }}>⏱ {formatDate(request.dueDate)}</span>
            ) : null}
          </div>

          {/* 취소 대기 배너 (요청자) */}
          {isRequester && request.status === 'cancel_requested' && (
            <div data-testid="cancel-banner" style={{ margin: '0 24px', marginTop: 12, padding: '10px 12px', background: '#FAEEDA', borderRadius: 6, fontSize: 12, color: '#854F0B' }}>
              담당자({nameOf(request.toEmail)})의 승인을 기다리고 있습니다
            </div>
          )}

          {/* 담당자 취소 요청 알림 배너 */}
          {isAssignee && request.status === 'cancel_requested' && (
            <div data-testid="assignee-cancel-banner" style={{ margin: '0 24px', marginTop: 12, padding: '12px', background: '#FBEAF0', border: '1px solid #F4C0D1', borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#993556', fontWeight: 500 }}>{nameOf(request.fromEmail)}님이 이 요청의 취소를 요청했습니다</div>
              <div style={{ fontSize: 11, color: '#72243E', marginTop: 4 }}>승인하면 요청이 취소되고, 관련 할일도 삭제됩니다.</div>
            </div>
          )}

          {/* 취소 요청 확인 다이얼로그 */}
          {showCancelConfirm && (
            <div style={{ margin: '0 24px', marginTop: 12, padding: '12px 16px', background: '#FFF5F2', border: '1px solid #C17B6B', borderRadius: 6, fontSize: 12 }}>
              <div style={{ color: '#2C1810', marginBottom: 8 }}>이 요청의 취소를 요청하시겠습니까? 담당자가 승인해야 취소됩니다.</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCancelConfirm(false)} style={{ fontSize: 11, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>아니오</button>
                <button onClick={handleRequestCancel} disabled={isActioning} data-testid="confirm-cancel"
                  style={{ fontSize: 11, padding: '5px 14px', color: '#C17B6B', border: '1px solid #C17B6B', background: 'none', cursor: isActioning ? 'not-allowed' : 'pointer' }}>
                  {isActioning ? '처리 중...' : '네, 취소 요청'}
                </button>
              </div>
            </div>
          )}

          {/* 중앙 분할 영역 — 좌 3(본문+메타) / 우 7(타임라인+댓글입력) */}
          <div
            data-testid="popup-split"
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* 좌측: 본문 + 메타 */}
            <div
              data-testid="popup-left"
              style={{
                flex: isMobile ? 'none' : '0 1 30%',
                padding: '16px 24px',
                borderRight: isMobile ? 'none' : `1px solid ${colors.border}`,
                borderBottom: isMobile ? `1px solid ${colors.border}` : 'none',
                overflowY: 'auto',
                minHeight: 0,
                minWidth: 0,
              }}
            >
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  data-testid="edit-content"
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
                />
              ) : request.content ? (
                <div style={{ fontSize: 13, color: '#2C1810', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 12 }}>
                  {request.content}
                </div>
              ) : null}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: isEditing ? 8 : 0 }}>
                <div style={{ fontSize: 10, color: '#9E8880' }}>생성 {formatDate(request.createdAt)}</div>
                {request.resolvedAt && <div style={{ fontSize: 10, color: '#9E8880' }}>수락 {formatDate(request.resolvedAt)}</div>}
              </div>
            </div>

            {/* 우측: 타임라인 + 댓글 입력 */}
            <div
              data-testid="popup-right"
              style={{
                flex: isMobile ? 'none' : '0 1 70%',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                minWidth: 0,
              }}
            >
              {/* 타임라인 */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', minHeight: 120 }} data-testid="timeline">
            {comments.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 80 }}>
                <span style={{ fontSize: 11, color: '#9E8880' }}>아직 타임라인이 없습니다</span>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {comments.map((c, i) => {
                  const isLast = i === comments.length - 1;
                  const isMine = c.author === currentUser?.email;

                  if (c.type === 'system') {
                    const icon = EVENT_ICON[c.event || ''] || EVENT_ICON.accepted;
                    const label = EVENT_LABEL[c.event || ''] || c.event || '';
                    return (
                      <div key={c.id} style={{ display: 'flex', gap: 10, position: 'relative', paddingBottom: isLast ? 0 : 16 }} data-testid="timeline-system">
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: icon.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: icon.fg }}>
                            {icon.symbol}
                          </div>
                          {!isLast && <div style={{ position: 'absolute', left: 11, top: 24, bottom: -16, width: 1, background: '#EDE5DC' }} />}
                        </div>
                        <div style={{ flex: 1, paddingTop: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: '#9E8880' }}>{c.authorName}님이 {label}</span>
                            <span style={{ fontSize: 10, color: '#C4B8B0' }}>{formatTime(c.createdAt)}</span>
                          </div>
                          {c.event === 'rejected' && c.eventMeta?.reason && (
                            <div style={{ fontSize: 11, color: '#993556', marginTop: 3 }}>사유: {c.eventMeta.reason}</div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // user comment
                  const initial = c.authorName?.[0] || c.author?.[0] || '?';
                  return (
                    <div key={c.id} style={{ display: 'flex', gap: 10, position: 'relative', paddingBottom: isLast ? 0 : 16 }} data-testid="timeline-user">
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#F5F0EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#9E8880' }}>
                          {initial}
                        </div>
                        {!isLast && <div style={{ position: 'absolute', left: 11, top: 24, bottom: -16, width: 1, background: '#EDE5DC' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#9E8880' }}>{c.authorName}</span>
                          <span style={{ fontSize: 10, color: '#C4B8B0' }}>{formatTime(c.createdAt)}</span>
                          {isMine && c.type === 'user' && (
                            <span onClick={() => handleDeleteComment(c.id)}
                              style={{ fontSize: 9, color: '#C4B8B0', cursor: 'pointer', marginLeft: 'auto' }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#C17B6B')}
                              onMouseLeave={e => (e.currentTarget.style.color = '#C4B8B0')}>
                              삭제
                            </span>
                          )}
                        </div>
                        <div style={{
                          padding: '8px 12px',
                          background: '#FDFAF8', border: '0.5px solid #EDE5DC',
                          borderRadius: '0 6px 6px 6px',
                          fontSize: 12, lineHeight: 1.5, color: '#2C1810',
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                          {c.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={commentsEndRef} />
              </div>
            )}
          </div>

              {/* 댓글 입력 */}
              {!isEditing && (
                <div style={{ borderTop: `1px solid ${colors.border}`, padding: '10px 24px', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                  <input
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                    placeholder="메모를 남겨주세요..."
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #EDE5DC', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', padding: '5px 0', fontFamily: 'inherit' }}
                  />
                  <button onClick={handleSendComment} disabled={isSending || !commentInput.trim()}
                    style={{
                      fontSize: 10, padding: '7px 16px', border: 'none',
                      background: !commentInput.trim() || isSending ? '#EDE5DC' : '#2C1810',
                      color: !commentInput.trim() || isSending ? '#9E8880' : '#FDF8F4',
                      cursor: !commentInput.trim() || isSending ? 'not-allowed' : 'pointer',
                    }}>
                    {isSending ? '전송 중...' : '전송'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 푸터 */}
          <div style={{ padding: '12px 24px', borderTop: `1px solid ${colors.border}`, background: '#FDF8F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderRadius: '0 0 4px 4px' }}>
            {isEditing ? (
              <>
                <button onClick={cancelEdit} style={{ fontSize: 11, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
                <button onClick={handleSave} disabled={isSaving || !editTitle.trim()} data-testid="save-button"
                  style={{
                    fontSize: 11, padding: '8px 20px', border: 'none', borderRadius: 2,
                    background: isSaving || !editTitle.trim() ? '#EDE5DC' : '#2C1810',
                    color: isSaving || !editTitle.trim() ? '#9E8880' : '#FDF8F4',
                    cursor: isSaving || !editTitle.trim() ? 'not-allowed' : 'pointer',
                  }}>
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose} style={{ fontSize: 11, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>닫기</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  {isRequester && request.status === 'accepted' && (
                    <button onClick={() => setShowCancelConfirm(true)} data-testid="request-cancel-btn"
                      style={{ fontSize: 11, padding: '7px 16px', color: '#C17B6B', border: '1px solid #C17B6B', background: 'none', cursor: 'pointer', borderRadius: 2 }}>
                      취소 요청
                    </button>
                  )}
                  {isRequester && request.status === 'cancel_requested' && (
                    <button onClick={handleWithdrawCancel} disabled={isActioning} data-testid="withdraw-cancel-btn"
                      style={{ fontSize: 11, color: '#9E8880', background: 'none', border: 'none', cursor: isActioning ? 'not-allowed' : 'pointer' }}>
                      {isActioning ? '처리 중...' : '취소 요청 철회'}
                    </button>
                  )}
                  {isAssignee && request.status === 'cancel_requested' && (
                    <>
                      <button onClick={handleDenyCancellation} disabled={isActioning} data-testid="deny-cancel-btn"
                        style={{ fontSize: 11, padding: '7px 14px', background: '#EAF3DE', color: '#3B6D11', border: '1px solid #C0DD97', borderRadius: 2, cursor: isActioning ? 'not-allowed' : 'pointer' }}>
                        취소 거부
                      </button>
                      <button onClick={handleApproveCancellation} disabled={isActioning} data-testid="approve-cancel-btn"
                        style={{ fontSize: 11, padding: '7px 14px', background: '#FBEAF0', color: '#993556', border: '1px solid #F4C0D1', borderRadius: 2, cursor: isActioning ? 'not-allowed' : 'pointer' }}>
                        취소 승인
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
