'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePostStore, Post, initPostListener } from '@/store/postStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { daysUntil } from '@/lib/dateUtils';
import TodoSegment, { SegmentType } from '@/components/mydesk/TodoSegment';
import TodoFilterBar, { FilterType } from '@/components/mydesk/TodoFilterBar';
import TodoSortDropdown, { SortKey, getDefaultSort } from '@/components/mydesk/TodoSortDropdown';
import TodoItemRow from '@/components/mydesk/TodoItemRow';
import TodoBulkBar from '@/components/mydesk/TodoBulkBar';

const ALL_FILTERS = new Set<FilterType>(['work', 'request', 'personal']);
const CATEGORY_ORDER: Record<string, number> = { work: 0, request: 1, personal: 2 };

function getCategory(post: Post): FilterType {
  if (post.requestFrom) return 'request';
  if (post.taskType === 'personal') return 'personal';
  return 'work';
}

export default function TodoPage() {
  const { user } = useAuthStore();
  const { posts, updatePost, deletePost } = usePostStore();
  const { completeRequest, reactivateRequest } = useTodoRequestStore();
  const { addToast } = useToastStore();

  const [segment, setSegment] = useState<SegmentType>('active');
  const [filters, setFilters] = useState<Set<FilterType>>(new Set(ALL_FILTERS));
  const [sortKey, setSortKey] = useState<SortKey>(getDefaultSort('active'));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const email = user?.email || '';

  useEffect(() => {
    const cleanup = initPostListener();
    return cleanup;
  }, []);

  // 세그먼트 전환 시 정렬 초기화 + 선택 해제
  const handleSegmentChange = (s: SegmentType) => {
    setSegment(s);
    setSortKey(getDefaultSort(s));
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  // 내 할일 필터
  const myTodos = useMemo(() =>
    posts.filter(p => p.author === email && p.category === '할일'),
  [posts, email]);

  const counts = useMemo(() => ({
    active: myTodos.filter(p => !p.completed && !p.deleted).length,
    completed: myTodos.filter(p => p.completed && !p.deleted).length,
    trash: myTodos.filter(p => p.deleted).length,
  }), [myTodos]);

  // 세그먼트 + 카테고리 필터
  const filtered = useMemo(() => {
    let list = myTodos;
    if (segment === 'active') list = list.filter(p => !p.completed && !p.deleted);
    else if (segment === 'completed') list = list.filter(p => p.completed && !p.deleted);
    else list = list.filter(p => p.deleted);
    return list.filter(p => filters.has(getCategory(p)));
  }, [myTodos, segment, filters]);

  // 정렬
  const sorted = useMemo(() => {
    const arr = [...filtered];
    // 별표 최상단 고정 (진행 중만)
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

  // 벌크 액션
  const actor = { email, name: user?.displayName || email.split('@')[0] };

  const bulkComplete = async () => {
    for (const id of selected) {
      const p = posts.find(pp => pp.id === id);
      if (!p) continue;
      try {
        await updatePost(id, { completed: true, completedAt: new Date() });
        if (p.requestId) await completeRequest(p.requestId, actor);
      } catch (e) { console.error(e); addToast({ message: '완료 처리 실패', type: 'error' }); }
    }
    setSelected(new Set());
  };

  const bulkTrash = async () => {
    for (const id of selected) {
      try { await updatePost(id, { deleted: true, deletedAt: new Date() }); }
      catch (e) { console.error(e); addToast({ message: '삭제 실패', type: 'error' }); }
    }
    setSelected(new Set());
  };

  const bulkRestore = async () => {
    for (const id of selected) {
      const p = posts.find(pp => pp.id === id);
      if (!p) continue;
      try {
        await updatePost(id, { deleted: false, completed: false, completedAt: null, deletedAt: null });
        if (p.requestId) await reactivateRequest(p.requestId, actor);
      } catch (e) { console.error(e); addToast({ message: '복원 실패', type: 'error' }); }
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
    const p = posts.find(pp => pp.id === id);
    if (!p) return;
    try {
      await updatePost(id, { deleted: false, completed: false, completedAt: null, deletedAt: null });
      if (p.requestId) await reactivateRequest(p.requestId, actor);
      addToast({ message: '복원되었습니다', type: 'success' });
    } catch (e) { console.error(e); addToast({ message: '복원 실패', type: 'error' }); }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('이 항목을 영구 삭제하시겠습니까? 복구할 수 없습니다.')) return;
    try {
      await deletePost(id);
      addToast({ message: '영구 삭제되었습니다', type: 'info' });
    } catch (e) { console.error(e); addToast({ message: '영구 삭제 실패', type: 'error' }); }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('휴지통을 비우시겠습니까? 모든 항목이 영구 삭제됩니다.')) return;
    const trashItems = myTodos.filter(p => p.deleted);
    for (const p of trashItems) {
      try { await deletePost(p.id); }
      catch (e) { console.error(e); }
    }
    addToast({ message: `${trashItems.length}건 영구 삭제`, type: 'info' });
  };

  return (
    <div>
      <TodoSegment segment={segment} onChange={handleSegmentChange} counts={counts} onEmptyTrash={handleEmptyTrash} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <TodoFilterBar active={filters} onChange={setFilters} />
        <TodoSortDropdown segment={segment} sortKey={sortKey} onChange={setSortKey} />
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#9E8880', fontSize: 12 }}>
          항목이 없습니다
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
              onComplete={segment === 'completed' ? undefined : () => {}}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
            />
          ))}
        </div>
      )}

      <TodoBulkBar
        segment={segment}
        count={selected.size}
        onComplete={segment === 'active' ? bulkComplete : undefined}
        onTrash={segment !== 'trash' ? bulkTrash : undefined}
        onRestore={segment !== 'active' ? bulkRestore : undefined}
        onPermanentDelete={segment === 'trash' ? bulkPermanentDelete : undefined}
        onCancel={() => setSelected(new Set())}
      />
    </div>
  );
}

function sortCompare(a: Post, b: Post, key: SortKey): number {
  switch (key) {
    case 'due-asc': {
      const da = daysUntil(a.dueDate);
      const db = daysUntil(b.dueDate);
      return da - db;
    }
    case 'newest': return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
    case 'oldest': return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
    case 'name': return (a.content || '').localeCompare(b.content || '');
    case 'category': {
      const ca = CATEGORY_ORDER[getCategory(a)] ?? 9;
      const cb = CATEGORY_ORDER[getCategory(b)] ?? 9;
      return ca - cb;
    }
    case 'completed-desc': return (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0);
    case 'completed-asc': return (a.completedAt?.getTime() || 0) - (b.completedAt?.getTime() || 0);
    case 'deleted-desc': return (b.deletedAt?.getTime() || 0) - (a.deletedAt?.getTime() || 0);
    case 'deleted-asc': return (a.deletedAt?.getTime() || 0) - (b.deletedAt?.getTime() || 0);
    default: return 0;
  }
}
