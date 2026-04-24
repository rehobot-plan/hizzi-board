'use client';

import { useState, useMemo } from 'react';
import { Post, usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import TodoItem from './TodoItem';
import RecordModal, { RecordTab } from './RecordModal';
import { selectRecentlyCompleted, selectRecentlyDeleted, canViewPost } from '@/lib/postSelectors';

interface TodoListProps {
  panelId: string;
  ownerEmail?: string | null;
  posts: Post[];
  canEdit: boolean;
  activeFilter?: ('업무' | '요청' | '개인')[];
}

export default function TodoList({ panelId, ownerEmail, posts, canEdit, activeFilter = ['업무', '요청'] }: TodoListProps) {
  const { posts: allPosts } = usePostStore();
  const user = useAuthStore(s => s.user);
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordTab, setRecordTab] = useState<RecordTab>('completed');

  // 카운트·모달 표시가 동일 visibleTo 기준으로 일관하도록 scopedPosts에서 권한 필터 선반영.
  const scopedPosts = useMemo(
    () => {
      const viewer = user ? { email: user.email, role: user.role } : null;
      return allPosts.filter(p => p.panelId === panelId && p.category === '할일' && canViewPost(p, viewer));
    },
    [allPosts, panelId, user]
  );

  const recentCompletedCount = useMemo(
    () => selectRecentlyCompleted(scopedPosts).length,
    [scopedPosts]
  );
  const recentDeletedCount = useMemo(
    () => selectRecentlyDeleted(scopedPosts).length,
    [scopedPosts]
  );

  // Codex #60 P2 가드: 링크 카운트(scopedPosts)와 메인 리스트(todoAll)를 단일 소스(allPosts)에서 파생.
  // posts prop은 Panel 인터페이스 호환용으로만 유지 — 내부 필터는 scopedPosts 기준.
  const todoAll = scopedPosts.filter(p => !p.deleted);

  const activeTodos = todoAll
      .filter(p => {
        if (p.completed) return false;
        if (!activeFilter || activeFilter.length === 0) return true;
        if (p.requestFrom) return activeFilter.includes('요청');
        if (p.taskType === 'personal') return activeFilter.includes('개인');
        return activeFilter.includes('업무');
      })
    .sort((a, b) => {
      if (a.starred && !b.starred) return -1;
      if (!a.starred && b.starred) return 1;
      const aDue = a.dueDate || a.requestDueDate;
      const bDue = b.dueDate || b.requestDueDate;
      if (aDue && bDue) {
        const diff = new Date(aDue).getTime() - new Date(bDue).getTime();
        if (diff !== 0) return diff;
      } else if (aDue) return -1;
      else if (bDue) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const openRecord = (tab: RecordTab) => {
    setRecordTab(tab);
    setRecordOpen(true);
  };

  return (
    <>
      {activeTodos.length === 0 && (
        <p className="text-[#C1B6A6] text-center text-xs py-4">할일이 없습니다</p>
      )}
      {activeTodos.map(post => (
        <TodoItem key={post.id} post={post} canEdit={canEdit} />
      ))}

      {(recentCompletedCount > 0 || recentDeletedCount > 0) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, padding: '10px 0 4px', borderTop: '1px solid #EDE5DC', marginTop: 8 }}>
          {recentCompletedCount > 0 && (
            <button
              onClick={() => openRecord('completed')}
              style={{ fontSize: 10, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em', transition: 'color 0.15s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#5C1F1F')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9E8880')}
            >
              최근 완료 {recentCompletedCount}개 →
            </button>
          )}
          {recentDeletedCount > 0 && (
            <button
              onClick={() => openRecord('deleted')}
              style={{ fontSize: 10, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em', transition: 'color 0.15s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#5C1F1F')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9E8880')}
            >
              최근 삭제 {recentDeletedCount}개 →
            </button>
          )}
        </div>
      )}

      <RecordModal
        isOpen={recordOpen}
        onClose={() => setRecordOpen(false)}
        panelId={panelId}
        category="할일"
        defaultTab={recordTab}
        windowFilter="recent"
        canEdit={canEdit}
      />
    </>
  );
}
