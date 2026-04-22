'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePostStore, Post, initPostListener } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import TodoSegment, { SegmentType } from '@/components/mydesk/TodoSegment';
import TodoFilterBar, { FilterType, getDefaultFilters } from '@/components/mydesk/TodoFilterBar';
import TodoSortDropdown, { SortKey, getDefaultSort } from '@/components/mydesk/TodoSortDropdown';
import TodoItemRow from '@/components/mydesk/TodoItemRow';
import TodoBulkBar from '@/components/mydesk/TodoBulkBar';

const CATEGORY_ORDER: Record<string, number> = { work: 0, personal: 1 };

function getCategory(post: Post): FilterType {
  return post.taskType === 'personal' ? 'personal' : 'work';
}

export default function MemoPage() {
  const { user } = useAuthStore();
  const { posts, updatePost, deletePost } = usePostStore();
  const { addToast } = useToastStore();

  const [segment, setSegment] = useState<SegmentType>('active');
  const [filters, setFilters] = useState<Set<FilterType>>(getDefaultFilters('memo'));
  const [sortKey, setSortKey] = useState<SortKey>(getDefaultSort('active', 'memo'));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const email = user?.email || '';

  useEffect(() => { const c = initPostListener(); return c; }, []);

  const handleSegmentChange = (s: SegmentType) => {
    if (s === 'completed') return; // 메모에는 완료 세그먼트 없음
    setSegment(s);
    setSortKey(getDefaultSort(s, 'memo'));
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const myMemos = useMemo(() =>
    posts.filter(p => p.author === email && p.category === '메모'),
  [posts, email]);

  const counts = useMemo(() => ({
    active: myMemos.filter(p => !p.deleted).length,
    completed: 0,
    trash: myMemos.filter(p => p.deleted).length,
  }), [myMemos]);

  const filtered = useMemo(() => {
    let list = myMemos;
    if (segment === 'active') list = list.filter(p => !p.deleted);
    else list = list.filter(p => p.deleted);
    return list.filter(p => filters.has(getCategory(p)));
  }, [myMemos, segment, filters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (segment === 'active') {
      arr.sort((a, b) => {
        if (a.starred && !b.starred) return -1;
        if (!a.starred && b.starred) return 1;
        return sortCompare(a, b, sortKey);
      });
    } else {
      arr.sort((a, b) => sortCompare(a, b, sortKey));
    }
    return arr;
  }, [filtered, sortKey, segment]);

  const bulkTrash = async () => {
    for (const id of selected) {
      try { await updatePost(id, { deleted: true, deletedAt: new Date() }); }
      catch (e) { console.error(e); addToast({ message: '삭제 실패', type: 'error' }); }
    }
    setSelected(new Set());
  };

  const bulkRestore = async () => {
    for (const id of selected) {
      try { await updatePost(id, { deleted: false, deletedAt: null }); }
      catch (e) { console.error(e); addToast({ message: '복원 실패', type: 'error' }); }
    }
    setSelected(new Set());
  };

  const bulkPermanentDelete = async () => {
    if (!confirm('선택한 항목을 영구 삭제하시겠습니까? 복구할 수 없습니다.')) return;
    for (const id of selected) {
      try { await deletePost(id); }
      catch (e) { console.error(e); addToast({ message: '영구 삭제 실패', type: 'error' }); }
    }
    setSelected(new Set());
  };

  const handleRestore = async (id: string) => {
    try {
      await updatePost(id, { deleted: false, deletedAt: null });
      addToast({ message: '복원되었습니다', type: 'success' });
    } catch (e) { console.error(e); addToast({ message: '복원 실패', type: 'error' }); }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('이 항목을 영구 삭제하시겠습니까?')) return;
    try {
      await deletePost(id);
      addToast({ message: '영구 삭제되었습니다', type: 'info' });
    } catch (e) { console.error(e); addToast({ message: '영구 삭제 실패', type: 'error' }); }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('휴지통을 비우시겠습니까? 모든 항목이 영구 삭제됩니다.')) return;
    const trashItems = myMemos.filter(p => p.deleted);
    for (const p of trashItems) {
      try { await deletePost(p.id); } catch (e) { console.error(e); }
    }
    addToast({ message: `${trashItems.length}건 영구 삭제`, type: 'info' });
  };

  return (
    <div>
      <TodoSegment segment={segment} onChange={handleSegmentChange} counts={counts} onEmptyTrash={handleEmptyTrash} mode="memo" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <TodoFilterBar active={filters} onChange={setFilters} mode="memo" />
        <TodoSortDropdown segment={segment} sortKey={sortKey} onChange={setSortKey} />
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#9E8880', fontSize: 12 }}>
          메모가 없습니다
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sorted.map(p => (
            <TodoItemRow
              key={p.id}
              post={p}
              segment={segment}
              selected={selected.has(p.id)}
              onSelect={toggleSelect}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              mode="memo"
            />
          ))}
        </div>
      )}

      <TodoBulkBar
        segment={segment}
        count={selected.size}
        onTrash={segment === 'active' ? bulkTrash : undefined}
        onRestore={segment === 'trash' ? bulkRestore : undefined}
        onPermanentDelete={segment === 'trash' ? bulkPermanentDelete : undefined}
        onCancel={() => setSelected(new Set())}
      />
    </div>
  );
}

function sortCompare(a: Post, b: Post, key: SortKey): number {
  switch (key) {
    case 'newest': return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
    case 'oldest': return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
    case 'name': return (a.content || '').localeCompare(b.content || '');
    case 'category': return (CATEGORY_ORDER[getCategory(a)] ?? 9) - (CATEGORY_ORDER[getCategory(b)] ?? 9);
    case 'deleted-desc': return (b.deletedAt?.getTime() || 0) - (a.deletedAt?.getTime() || 0);
    case 'deleted-asc': return (a.deletedAt?.getTime() || 0) - (b.deletedAt?.getTime() || 0);
    default: return 0;
  }
}
