'use client';

import { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Post, usePostStore } from '@/store/postStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { colors, tagColors } from '@/styles/tokens';

interface Comment {
  id: string;
  requestId: string;
  author: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

interface RequestDetailModalProps {
  post: Post;
  canEdit: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestDetailModal({ post, canEdit, isOpen, onClose }: RequestDetailModalProps) {
  const { updatePost } = usePostStore();
  const { completeRequest } = useTodoRequestStore();
  const { users } = useUserStore();
  const currentUser = useAuthStore(s => s.user);

  const [isCompleting, setIsCompleting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !post.requestId) return;
    const q = query(
      collection(db, 'comments'),
      where('requestId', '==', post.requestId),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Comment[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          requestId: data.requestId,
          author: data.author,
          authorName: data.authorName,
          content: data.content,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        };
      });
      setComments(list);
    }, (error) => {
      console.error('Comments subscription error:', error);
    });
    return () => unsubscribe();
  }, [isOpen, post.requestId]);

  useEffect(() => {
    if (comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments.length]);

  const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const formatTime = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleComplete = async () => {
    if (!canEdit || isCompleting) return;
    setIsCompleting(true);
    try {
      await updatePost(post.id, { completed: true, completedAt: new Date() });
      if (post.requestId) await completeRequest(post.requestId);
      onClose();
    } catch (e) {
      console.error(e);
      const { useToastStore } = await import('@/store/toastStore');
      useToastStore.getState().addToast({ message: '완료 처리에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentInput.trim() || isSending || !currentUser || !post.requestId) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, 'comments'), {
        requestId: post.requestId,
        author: currentUser.email,
        authorName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
        content: commentInput.trim(),
        createdAt: serverTimestamp(),
      });
      setCommentInput('');
    } catch (e) {
      console.error(e);
      const { useToastStore } = await import('@/store/toastStore');
      useToastStore.getState().addToast({ message: '댓글 전송에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (e) {
      console.error(e);
      const { useToastStore } = await import('@/store/toastStore');
      useToastStore.getState().addToast({ message: '댓글 삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.35)', zIndex: 1000 }} />
        <Dialog.Content style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: colors.cardBg, border: `1px solid ${colors.border}`, width: '100%', maxWidth: 860, display: 'flex', flexDirection: 'column', maxHeight: '90vh', zIndex: 1001 }}>
          <VisuallyHidden.Root><Dialog.Description>요청 할일 상세 모달</Dialog.Description></VisuallyHidden.Root>
          <div style={{ background: colors.sidebarBg, padding: '20px 28px', flexShrink: 0 }}>
            <Dialog.Title style={{ fontSize: 20, fontWeight: 700, color: colors.mainBg, lineHeight: 1.4, marginBottom: 12, margin: 0 }}>{post.content}</Dialog.Title>
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
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {comments.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, color: colors.textHint }}>아직 댓글이 없습니다</span>
                  </div>
                ) : (
                  comments.map(c => {
                    const isMine = c.author === currentUser?.email;
                    return (
                      <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          {!isMine && <span style={{ fontSize: 10, fontWeight: 600, color: colors.textSecondary }}>{c.authorName}</span>}
                          <span style={{ fontSize: 9, color: colors.textHint }}>{formatTime(c.createdAt)}</span>
                          {isMine && (
                            <span onClick={() => handleDeleteComment(c.id)}
                              style={{ fontSize: 9, color: colors.textHint, cursor: 'pointer', transition: 'color 0.15s' }}
                              onMouseEnter={e => (e.currentTarget.style.color = colors.accent)}
                              onMouseLeave={e => (e.currentTarget.style.color = colors.textHint)}>
                              삭제
                            </span>
                          )}
                        </div>
                        <div style={{
                          maxWidth: '80%',
                          padding: '8px 12px',
                          borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          background: isMine ? colors.accent : colors.altRowBg,
                          color: isMine ? colors.mainBg : colors.textPrimary,
                          fontSize: 12,
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}>
                          {c.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={commentsEndRef} />
              </div>
              <div style={{ borderTop: `1px solid ${colors.border}`, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                <input
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                  placeholder="메모를 남겨주세요..."
                  style={{ flex: 1, border: 'none', borderBottom: `1px solid ${colors.border}`, fontSize: 12, color: colors.textPrimary, outline: 'none', background: 'transparent', padding: '5px 0', fontFamily: 'inherit' }} />
                <button onClick={handleSendComment} disabled={isSending || !commentInput.trim()}
                  style={{ fontSize: 10, padding: '7px 16px', background: !commentInput.trim() || isSending ? colors.border : colors.textPrimary, color: !commentInput.trim() || isSending ? colors.textSecondary : colors.mainBg, border: 'none', cursor: !commentInput.trim() || isSending ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease' }}>
                  {isSending ? '전송 중...' : '전송'}
                </button>
              </div>
            </div>
          </div>
          <div style={{ padding: '12px 28px', borderTop: `1px solid ${colors.border}`, background: colors.mainBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <button onClick={onClose} style={{ fontSize: 11, letterSpacing: '0.04em', color: colors.textSecondary, background: 'none', border: 'none', cursor: 'pointer' }}>닫기</button>
            <button onClick={handleComplete} disabled={isCompleting}
              style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '9px 24px', background: colors.textPrimary, color: colors.mainBg, border: 'none', cursor: isCompleting ? 'not-allowed' : 'pointer', opacity: isCompleting ? 0.6 : 1 }}>
              {isCompleting ? '처리 중...' : '완료 처리'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
