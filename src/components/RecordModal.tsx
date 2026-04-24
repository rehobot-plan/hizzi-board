'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePostStore, Post } from '@/store/postStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { useEscClose } from '@/hooks/useEscClose';
import { selectRecentlyCompleted, selectRecentlyDeleted, canViewPost } from '@/lib/postSelectors';

export type RecordTab = 'completed' | 'deleted';
export type RecordWindow = 'recent' | 'all';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  panelId: string;
  category: '할일' | '메모';
  defaultTab: RecordTab;
  windowFilter: RecordWindow;
  canEdit: boolean;
}

function formatDateTime(d: Date | null | undefined): string {
  if (!d) return '-';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function RecordModal({
  isOpen,
  onClose,
  panelId,
  category,
  defaultTab,
  windowFilter,
  canEdit,
}: RecordModalProps) {
  const { posts } = usePostStore();
  const { reactivateRequest } = useTodoRequestStore();
  const { addToast } = useToastStore();
  const currentUser = useAuthStore(s => s.user);
  const [tab, setTab] = useState<RecordTab>(defaultTab);
  const [mounted, setMounted] = useState(false);

  useEscClose(onClose, isOpen);

  useEffect(() => setMounted(true), []);
  useEffect(() => { if (isOpen) setTab(defaultTab); }, [isOpen, defaultTab]);

  // visibleTo 필터 공유 — 1·2·3층 전부 동일 권한 판정(postSelectors.canViewPost).
  const scopedPosts = useMemo(() => {
    return posts.filter(p =>
      p.panelId === panelId &&
      p.category === category &&
      canViewPost(p, currentUser ? { email: currentUser.email, role: currentUser.role } : null),
    );
  }, [posts, panelId, category, currentUser]);

  const completedList = useMemo(() => {
    if (category !== '할일') return [];
    const filtered = windowFilter === 'recent'
      ? selectRecentlyCompleted(scopedPosts)
      : scopedPosts.filter(p => p.completed && !p.deleted);
    return [...filtered].sort((a, b) => {
      const at = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bt = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bt - at;
    });
  }, [scopedPosts, windowFilter, category]);

  const deletedList = useMemo(() => {
    const filtered = windowFilter === 'recent'
      ? selectRecentlyDeleted(scopedPosts)
      : scopedPosts.filter(p => p.deleted);
    return [...filtered].sort((a, b) => {
      const at = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
      const bt = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
      return bt - at;
    });
  }, [scopedPosts, windowFilter]);

  if (!isOpen || !mounted) return null;

  const showCompletedTab = category === '할일';
  const items = tab === 'completed' ? completedList : deletedList;
  const windowLabel = windowFilter === 'recent' ? '최근 24시간' : '전체';

  const restore = async (p: Post) => {
    try {
      // post 상태 복구 성공 확인 후에만 cascade 호출 (Codex #60 P1 가드)
      const ok = tab === 'completed'
        ? await usePostStore.getState().uncompletePost(p.id)
        : await usePostStore.getState().restorePost(p.id);
      if (!ok) return;
      if (p.requestId) {
        await reactivateRequest(p.requestId, { email: currentUser?.email || '', name: currentUser?.displayName || '' });
      }
    } catch (e) {
      console.error(e);
      addToast({ message: '복구에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    }
  };

  const hardDelete = async (p: Post) => {
    if (!window.confirm('이 항목을 완전히 삭제할까요?')) return;
    try {
      await usePostStore.getState().hardDeletePost(p.id);
    } catch (e) {
      console.error(e);
      addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    }
  };

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(44,24,16,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#FDF8F4', width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(44,24,16,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 (M1 스타일) */}
        <div style={{ background: '#5C1F1F', color: '#FDF8F4', padding: '12px 16px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.7 }}>RECORD · {windowLabel}</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>기록 — {category}</div>
        </div>

        {/* 탭 바 */}
        <div style={{ display: 'flex', background: '#FDF8F4', borderBottom: '1px solid #EDE5DC' }}>
          {showCompletedTab && (
            <button
              onClick={() => setTab('completed')}
              style={{
                flex: 1, padding: '10px 12px', fontSize: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: tab === 'completed' ? '#5C1F1F' : '#9E8880',
                fontWeight: tab === 'completed' ? 700 : 400,
                borderBottom: tab === 'completed' ? '2px solid #5C1F1F' : '2px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              완료 ({completedList.length})
            </button>
          )}
          <button
            onClick={() => setTab('deleted')}
            style={{
              flex: 1, padding: '10px 12px', fontSize: 12,
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === 'deleted' ? '#5C1F1F' : '#9E8880',
              fontWeight: tab === 'deleted' ? 700 : 400,
              borderBottom: tab === 'deleted' ? '2px solid #5C1F1F' : '2px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            휴지통 ({deletedList.length})
          </button>
        </div>

        {/* 바디 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
          {items.length === 0 && (
            <p style={{ fontSize: 11, color: '#C4B8B0', padding: '24px 0', textAlign: 'center' }}>
              {tab === 'completed' ? '완료된 항목이 없습니다' : '삭제된 항목이 없습니다'}
            </p>
          )}
          {items.map(p => {
            const timeLabel = tab === 'completed'
              ? formatDateTime(p.completedAt)
              : formatDateTime(p.deletedAt);
            const isWork = p.taskType === 'work';
            return (
              <div
                key={p.id}
                style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid #EDE5DC', alignItems: 'center' }}
              >
                <span style={{ fontSize: 12, color: '#5C1F1F', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: tab === 'deleted' ? 'line-through' : 'none' }}>
                  {p.title || p.content}
                </span>
                {p.taskType && (
                  <span style={{ fontSize: 9, padding: '1px 5px', background: isWork ? '#FFF5F2' : '#F5F0EE', color: isWork ? '#C17B6B' : '#9E8880', flexShrink: 0 }}>
                    {isWork ? '업무' : '개인'}
                  </span>
                )}
                <span style={{ fontSize: 10, color: '#C4B8B0', flexShrink: 0 }}>{timeLabel}</span>
                {canEdit && (
                  <>
                    <button
                      onClick={() => restore(p)}
                      style={{ fontSize: 10, color: '#C17B6B', background: 'none', border: '1px solid #C17B6B', cursor: 'pointer', padding: '2px 8px', letterSpacing: '0.04em', transition: 'all 0.15s ease' }}
                    >
                      복구
                    </button>
                    {tab === 'deleted' && (
                      <button
                        onClick={() => hardDelete(p)}
                        style={{ fontSize: 10, color: '#9E8880', background: 'none', border: '1px solid #EDE5DC', cursor: 'pointer', padding: '2px 8px', letterSpacing: '0.04em', transition: 'all 0.15s ease' }}
                      >
                        영구삭제
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* 푸터 */}
        <div style={{ background: '#FDF8F4', borderTop: '1px solid #EDE5DC', padding: '10px 16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ fontSize: 11, color: '#9E8880', background: 'none', border: '1px solid #EDE5DC', cursor: 'pointer', padding: '4px 14px', letterSpacing: '0.04em', transition: 'all 0.15s ease' }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
