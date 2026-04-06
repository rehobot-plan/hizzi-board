'use client';

import { useState } from 'react';
import { usePostStore, Post } from '@/store/postStore';
import { useToastStore } from '@/store/toastStore';

interface DeletedTodoProps {
  deletedTodos: Post[];
  canEdit: boolean;
}

function formatTime(d: Date): string {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function DeletedTodo({ deletedTodos, canEdit }: DeletedTodoProps) {
  const { addToast } = useToastStore();
  const [showDeleted, setShowDeleted] = useState(false);
  const [showPastDeleted, setShowPastDeleted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayDeleted = deletedTodos.filter(p => {
    if (!p.deletedAt) return true;
    const dt = new Date(p.deletedAt);
    return dt >= today && dt < tomorrow;
  });

  const pastDeleted = deletedTodos.filter(p => {
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

  const DeletedRow = ({ p }: { p: Post }) => {
    const isSelected = selectedIds.includes(p.id);
    const taskColor = p.taskType === 'personal' ? '#7B5EA7' : '#C17B6B';
    const taskBg = p.taskType === 'personal' ? '#F0ECF5' : '#FFF5F2';
    const taskLabel = p.taskType === 'personal' ? '개인' : '업무';

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
        {!selectMode && canEdit && (
          <button
            onClick={async () => {
              try {
                await usePostStore.getState().updatePost(p.id, { deleted: false, deletedAt: null, completed: false, completedAt: null });
              } catch (e) {
                console.error(e);
                addToast({ message: '복구에 실패했습니다. 다시 시도해주세요.', type: 'error' });
              }
            }}
            style={{ fontSize: 9, color: '#C17B6B', flexShrink: 0, background: 'none', border: '1px solid #C17B6B', cursor: 'pointer', padding: '1px 6px', letterSpacing: '0.04em' }}
          >
            복구
          </button>
        )}
        <span style={{ fontSize: 11, color: '#9E8880', textDecoration: 'line-through', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.content}
        </span>
        <span style={{ fontSize: 8, padding: '1px 5px', background: taskBg, color: taskColor, border: `1px solid ${taskColor}`, flexShrink: 0 }}>
          {taskLabel}
        </span>
        <span style={{ fontSize: 9, color: '#C4B8B0', flexShrink: 0 }}>
          {p.deletedAt ? formatTime(new Date(p.deletedAt)) : '-'}
        </span>
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setShowDeleted(v => !v)}
        style={{ fontSize: 10, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', letterSpacing: '0.06em', display: 'block', width: '100%', textAlign: 'left' }}
      >
        {showDeleted ? '▲ 삭제된 할일 숨기기' : `▼ 삭제된 할일 보기 (${deletedTodos.length})`}
      </button>

      {showDeleted && (
        <>
          {canEdit && deletedTodos.length > 0 && (
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
                      for (const id of selectedIds) {
                        await usePostStore.getState().hardDeletePost(id);
                      }
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
                    if (!window.confirm(`삭제된 할일 ${deletedTodos.length}개를 모두 완전히 삭제할까요?`)) return;
                    try {
                      for (const p of deletedTodos) {
                        await usePostStore.getState().hardDeletePost(p.id);
                      }
                    } catch (e) {
                      console.error(e);
                      addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
                    }
                  }}
                  style={{ fontSize: 10, color: '#C17B6B', background: 'none', border: '1px solid #C17B6B', cursor: 'pointer', padding: '2px 8px' }}>
                  전체 삭제 ({deletedTodos.length})
                </button>
              )}
            </div>
          )}

          <div style={{ borderTop: '1px solid #EDE5DC', paddingTop: 4 }}>
            {deletedTodos.length === 0 && (
              <p style={{ fontSize: 11, color: '#C4B8B0', padding: '8px 0' }}>삭제된 할일이 없습니다</p>
            )}
            {todayDeleted.length > 0 && (
              <>
                <div style={{ fontSize: 10, color: '#C4B8B0', padding: '6px 0 2px', letterSpacing: '0.06em' }}>오늘</div>
                {todayDeleted.map(p => <DeletedRow key={p.id} p={p} />)}
              </>
            )}
            {pastDeleted.length > 0 && (
              <>
                <button
                  onClick={() => setShowPastDeleted(v => !v)}
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
  );
}
