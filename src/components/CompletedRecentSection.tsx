'use client';

import { useState, useMemo } from 'react';
import { Post, usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import { selectRecentCompletedTop5 } from '@/lib/postSelectors';

interface CompletedRecentSectionProps {
  panelId: string;
  canEdit: boolean;
}

export default function CompletedRecentSection({ panelId, canEdit }: CompletedRecentSectionProps) {
  const allPosts = usePostStore(s => s.posts);
  const uncompletePost = usePostStore(s => s.uncompletePost);
  const archivePost = usePostStore(s => s.archivePost);
  const reactivateRequest = useTodoRequestStore(s => s.reactivateRequest);
  const user = useAuthStore(s => s.user);
  const addToast = useToastStore(s => s.addToast);
  const [expanded, setExpanded] = useState(false);

  const recent = useMemo(() => {
    const viewer = user ? { email: user.email, role: user.role } : null;
    const scoped = allPosts.filter(p => p.panelId === panelId && p.category === '할일' && !p.deleted);
    return selectRecentCompletedTop5(scoped, { viewer });
  }, [allPosts, panelId, user]);

  if (recent.length === 0) return null;

  // 요청 cascade 정합 — requestId 있으면 reactivateRequest 동반 호출(RecordModal.restore와 동일 패턴, flows.md 레이어 1).
  const handleRestore = async (p: Post) => {
    if (!canEdit) return;
    const ok = await uncompletePost(p.id);
    if (!ok) return;
    if (p.requestId) {
      await reactivateRequest(p.requestId, { email: user?.email || '', name: user?.displayName || '' });
    }
    addToast({ message: '활성 할일로 복원했습니다', type: 'info' });
  };

  const handleArchive = async (postId: string) => {
    if (!canEdit) return;
    const ok = await archivePost(postId);
    if (ok) addToast({ message: '보관으로 이관했습니다', type: 'info' });
  };

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #EDE5DC' }}>
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          fontSize: 11,
          color: '#9E8880',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          letterSpacing: '0.04em',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#6E6E6E')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#9E8880')}
      >
        <span>방금 완료한 {recent.length}개</span>
        <span style={{ fontSize: 9 }}>{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4 }}>
          {recent.map(p => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: '#F7F2EC',
                borderRadius: 4,
                fontSize: 12,
                color: '#9E8880',
              }}
            >
              <span
                style={{
                  textDecoration: 'line-through',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.title || p.content}
              </span>
              {canEdit && (
                <span style={{ display: 'flex', gap: 8, marginLeft: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleRestore(p)}
                    style={{
                      fontSize: 10,
                      color: '#6E6E6E',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#5C1F1F')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#6E6E6E')}
                  >
                    복원
                  </button>
                  <button
                    onClick={() => handleArchive(p.id)}
                    style={{
                      fontSize: 10,
                      color: '#6E6E6E',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#5C1F1F')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#6E6E6E')}
                  >
                    영구 완료
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
