'use client';

import { Post, usePostStore } from '@/store/postStore';
import { useToastStore } from '@/store/toastStore';
import PostItem from './PostItem';
import RecordModal from './RecordModal';
import { selectRecentlyDeleted } from '@/lib/postSelectors';
import { useMemo, useState } from 'react';

interface PostListProps {
  posts: Post[];
  activeCategory: string;
  panelId: string;
  canEdit: boolean;
  selectMode?: boolean;
  onSelectModeChange?: (v: boolean) => void;
}

export default function PostList({ posts, activeCategory, panelId, canEdit, selectMode = false, onSelectModeChange }: PostListProps) {
  const { deletePost } = usePostStore();
  const { addToast } = useToastStore();
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [recordOpen, setRecordOpen] = useState(false);

  const activePosts = posts.filter(p => !p.deleted);

  const { posts: allPosts } = usePostStore();
  const scopedPosts = useMemo(
    () => allPosts.filter(p => p.panelId === panelId && p.category === activeCategory),
    [allPosts, panelId, activeCategory]
  );
  const recentDeletedCount = useMemo(
    () => selectRecentlyDeleted(scopedPosts).length,
    [scopedPosts]
  );

  const visiblePosts = showAllPosts ? activePosts : activePosts.slice(0, 5);

  if (activePosts.length === 0 && recentDeletedCount === 0) {
    return <p className="text-[#C1B6A6] text-center text-xs py-4 leading-relaxed">게시물이 없습니다</p>;
  }

  const canShowRecordLink = activeCategory === '메모' && recentDeletedCount > 0;

  return (
    <>
      {activePosts.length === 0 && (
        <p className="text-[#C1B6A6] text-center text-xs py-4 leading-relaxed">게시물이 없습니다</p>
      )}
      {selectMode && canEdit && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 0', borderBottom: '1px solid #EDE5DC',
          marginBottom: 4,
        }}>
          <span style={{ fontSize: 10, color: '#9E8880', flex: 1 }}>
            {selectedIds.length > 0 ? `${selectedIds.length}개 선택됨` : '삭제할 메모를 선택하세요'}
          </span>
          <button
            onClick={async () => {
              if (activePosts.length === 0) return;
              try {
                for (const p of activePosts) await deletePost(p.id);
              } catch (e) {
                console.error(e);
                addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
              } finally {
                setSelectedIds([]);
                onSelectModeChange?.(false);
              }
            }}
            style={{
              fontSize: 10, padding: '2px 10px',
              color: '#C17B6B', background: 'none',
              border: '1px solid #C17B6B',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          >
            전체 삭제 ({activePosts.length})
          </button>
          <button
            onClick={async () => {
              if (selectedIds.length === 0) return;
              try {
                for (const id of selectedIds) await deletePost(id);
              } catch (e) {
                console.error(e);
                addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
              } finally {
                setSelectedIds([]);
                onSelectModeChange?.(false);
              }
            }}
            disabled={selectedIds.length === 0}
            style={{
              fontSize: 10, padding: '2px 10px',
              color: selectedIds.length > 0 ? '#C17B6B' : '#C4B8B0',
              background: 'none',
              border: `1px solid ${selectedIds.length > 0 ? '#C17B6B' : '#EDE5DC'}`,
              cursor: selectedIds.length > 0 ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
            }}
          >
            삭제 ({selectedIds.length})
          </button>
        </div>
      )}
      {visiblePosts.map((post) => (
        <div key={post.id} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          {selectMode && canEdit && (
            <input
              type="checkbox"
              checked={selectedIds.includes(post.id)}
              onChange={() => setSelectedIds(prev =>
                prev.includes(post.id) ? prev.filter(id => id !== post.id) : [...prev, post.id]
              )}
              style={{ flexShrink: 0, marginTop: 14, cursor: 'pointer', accentColor: '#C17B6B' }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
          {activeCategory === '전체' && post.category && post.category !== '전체' && (
            <span style={{
              fontSize: 9, padding: '1px 6px', marginBottom: 4, display: 'inline-block', letterSpacing: '0.06em',
              background: post.category === '할일' ? '#FFF5F2' : post.category === '공지' ? '#F5F0EE' : post.category === '메모' ? '#F0F5F5' : '#F5F5F0',
              color: post.category === '할일' ? '#C17B6B' : post.category === '공지' ? '#7A2828' : post.category === '메모' ? '#5C7A7A' : '#9E8880',
            }}>
              {post.category}
            </span>
          )}
          <PostItem post={post} />
          </div>
        </div>
      ))}
      {activePosts.length > 5 && (
        <button onClick={() => setShowAllPosts(v => !v)}
          style={{ fontSize: 10, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', letterSpacing: '0.06em', display: 'block', width: '100%', textAlign: 'center' }}>
          {showAllPosts ? '▲ 접기' : `▼ 더보기 (${activePosts.length - 5}개 더)`}
        </button>
      )}

      {canShowRecordLink && (
        <div style={{ display: 'flex', gap: 12, padding: '10px 0 4px', borderTop: '1px solid #EDE5DC', marginTop: 8 }}>
          <button
            onClick={() => setRecordOpen(true)}
            style={{ fontSize: 10, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em', transition: 'color 0.15s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#5C1F1F')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9E8880')}
          >
            최근 삭제 {recentDeletedCount}개 →
          </button>
        </div>
      )}

      {activeCategory === '메모' && (
        <RecordModal
          isOpen={recordOpen}
          onClose={() => setRecordOpen(false)}
          panelId={panelId}
          category="메모"
          defaultTab="deleted"
          windowFilter="recent"
          canEdit={canEdit}
        />
      )}
    </>
  );
}
