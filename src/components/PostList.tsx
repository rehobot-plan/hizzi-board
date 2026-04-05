'use client';

import { Post, usePostStore } from '@/store/postStore';
import { useToastStore } from '@/store/toastStore';
import PostItem from './PostItem';
import { useState } from 'react';

interface PostListProps {
  posts: Post[];
  activeCategory: string;
  panelId: string;
  canEdit: boolean;
}

function formatTime(d: Date): string {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function PostList({ posts, activeCategory, panelId, canEdit }: PostListProps) {
  const { hardDeletePost } = usePostStore();
  const { addToast } = useToastStore();
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [showPastDeleted, setShowPastDeleted] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 활성 메모 (deleted 아닌 것) — Panel에서 이미 필터됐지만 명시적으로 한 번 더
  const activePosts = posts.filter(p => !p.deleted);

  // 삭제된 메모 — 같은 panelId + category
  const { posts: allPosts } = usePostStore();
  const deletedPosts = allPosts.filter(p =>
    p.panelId === panelId &&
    p.category === activeCategory &&
    p.deleted === true
  );

  const todayDeleted = deletedPosts.filter(p => {
    if (!p.deletedAt) return true;
    const dt = new Date(p.deletedAt);
    return dt >= today && dt < tomorrow;
  });

  const pastDeleted = deletedPosts.filter(p => {
    if (!p.deletedAt) return false;
    const dt = new Date(p.deletedAt);
    return dt < today;
  });

  const pastGrouped: Record<string, Post[]> = {};
  pastDeleted.forEach(p => {
    const dt = p.deletedAt ? new Date(p.deletedAt) : new Date();
    const key = dt.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
    if (!pastGrouped[key]) pastGrouped[key] = [];
    pastGrouped[key].push(p);
  });

  const visiblePosts = showAllPosts ? activePosts : activePosts.slice(0, 5);

  const DeletedRow = ({ p }: { p: Post }) => {
    const isSelected = selectedIds.includes(p.id);
    const isWork = p.taskType === 'work';
    const visLabel =
      !p.visibleTo || p.visibleTo.length === 0 ? '전체' :
      p.visibleTo.length === 1 && p.visibleTo[0] === p.author ? '나만' : '특정인';
    const visColor =
      visLabel === '전체' ? '#639922' :
      visLabel === '나만' ? '#378ADD' : '#BA7517';

    return (
      <div style={{
        display: 'flex', gap: 8, padding: '6px 0',
        borderBottom: '1px solid #EDE5DC', alignItems: 'center',
        background: isSelected ? '#FFF5F2' : 'transparent',
      }}>
        {selectMode && canEdit && (
          <input type="checkbox" checked={isSelected}
            onChange={() => setSelectedIds(prev =>
              prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
            )}
            style={{ flexShrink: 0, cursor: 'pointer', accentColor: '#C17B6B' }} />
        )}
        <span style={{ fontSize: 11, color: '#9E8880', textDecoration: 'line-through', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.content}
        </span>
        {p.taskType && (
          <span style={{ fontSize: 9, padding: '1px 5px', background: isWork ? '#FFF5F2' : '#F5F0EE', color: isWork ? '#C17B6B' : '#9E8880', flexShrink: 0 }}>
            {isWork ? '업무' : '개인'}
          </span>
        )}
        <span style={{ fontSize: 9, padding: '1px 5px', color: visColor, flexShrink: 0 }}>
          {visLabel}
        </span>
        <span style={{ fontSize: 10, color: '#C4B8B0', flexShrink: 0 }}>
          {p.deletedAt ? formatTime(new Date(p.deletedAt)) : '-'}
        </span>
      </div>
    );
  };

  if (activePosts.length === 0 && deletedPosts.length === 0) {
    return <p className="text-[#C1B6A6] text-center text-xs py-4 leading-relaxed">게시물이 없습니다</p>;
  }

  return (
    <>
      {activePosts.length === 0 && (
        <p className="text-[#C1B6A6] text-center text-xs py-4 leading-relaxed">게시물이 없습니다</p>
      )}
      {visiblePosts.map((post) => (
        <div key={post.id} style={{ position: 'relative' }}>
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
      ))}
      {activePosts.length > 5 && (
        <button onClick={() => setShowAllPosts(v => !v)}
          style={{ fontSize: 10, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', letterSpacing: '0.06em', display: 'block', width: '100%', textAlign: 'center' }}>
          {showAllPosts ? '▲ 접기' : `▼ 더보기 (${activePosts.length - 5}개 더)`}
        </button>
      )}

      {/* 삭제된 메모 섹션 */}
      {activeCategory !== '전체' && (
        <>
          <button onClick={() => setShowDeleted(v => !v)}
            style={{ fontSize: 10, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', letterSpacing: '0.06em', display: 'block', width: '100%', textAlign: 'left' }}>
            {showDeleted ? '▲ 삭제된 메모 숨기기' : `▼ 삭제된 메모 보기 (${deletedPosts.length})`}
          </button>

          {showDeleted && (
            <>
              {canEdit && deletedPosts.length > 0 && (
                <div style={{ display: 'flex', gap: 8, padding: '6px 0', alignItems: 'center', borderBottom: '1px solid #EDE5DC' }}>
                  <button
                    onClick={() => { setSelectMode(v => !v); setSelectedIds([]); }}
                    style={{ fontSize: 10, color: selectMode ? '#C17B6B' : '#9E8880', background: 'none', border: `1px solid ${selectMode ? '#C17B6B' : '#EDE5DC'}`, cursor: 'pointer', padding: '2px 8px', letterSpacing: '0.04em' }}>
                    {selectMode ? '선택 취소' : '선택'}
                  </button>
                  {selectMode && selectedIds.length > 0 && (
                    <button
                      onClick={async () => {
                        try {
                          for (const id of selectedIds) await hardDeletePost(id);
                        } catch (e) {
                          console.error(e);
                          addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
                        } finally {
                          setSelectedIds([]);
                          setSelectMode(false);
                        }
                      }}
                      style={{ fontSize: 10, color: '#C17B6B', background: 'none', border: '1px solid #C17B6B', cursor: 'pointer', padding: '2px 8px' }}>
                      선택 삭제 ({selectedIds.length})
                    </button>
                  )}
                  {!selectMode && (
                    <button
                      onClick={async () => {
                        if (!window.confirm(`삭제된 메모 ${deletedPosts.length}개를 모두 완전히 삭제할까요?`)) return;
                        try {
                          for (const p of deletedPosts) await hardDeletePost(p.id);
                        } catch (e) {
                          console.error(e);
                          addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
                        }
                      }}
                      style={{ fontSize: 10, color: '#C17B6B', background: 'none', border: '1px solid #C17B6B', cursor: 'pointer', padding: '2px 8px' }}>
                      전체 삭제 ({deletedPosts.length})
                    </button>
                  )}
                </div>
              )}

              <div style={{ borderTop: '1px solid #EDE5DC', paddingTop: 4 }}>
                {deletedPosts.length === 0 && (
                  <p style={{ fontSize: 11, color: '#C4B8B0', padding: '8px 0' }}>삭제된 메모가 없습니다</p>
                )}
                {todayDeleted.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, color: '#C4B8B0', padding: '6px 0 2px', letterSpacing: '0.06em' }}>오늘</div>
                    {todayDeleted.map(p => <DeletedRow key={p.id} p={p} />)}
                  </>
                )}
                {pastDeleted.length > 0 && (
                  <>
                    <button onClick={() => setShowPastDeleted(v => !v)}
                      style={{ fontSize: 10, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', letterSpacing: '0.06em', display: 'block', width: '100%', textAlign: 'left', borderTop: todayDeleted.length > 0 ? '1px solid #EDE5DC' : 'none', marginTop: todayDeleted.length > 0 ? 4 : 0 }}>
                      {showPastDeleted ? '▲ 이전 삭제 숨기기' : `▼ 이전 삭제 보기 (${pastDeleted.length})`}
                    </button>
                    {showPastDeleted && Object.entries(pastGrouped).map(([date, items]) => (
                      <div key={date}>
                        <div style={{ fontSize: 10, color: '#C4B8B0', padding: '4px 0 2px', fontWeight: 600 }}>{date}</div>
                        {items.map(p => <DeletedRow key={p.id} p={p} />)}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
