'use client';

import { useState } from 'react';
import { usePostStore, Post } from '@/store/postStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';

interface CompletedTodoProps {
  completedTodos: Post[];
  canEdit: boolean;
}

function formatTime(d: Date): string {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(d: Date): string {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CompletedTodo({ completedTodos, canEdit }: CompletedTodoProps) {
  const { reactivateRequest } = useTodoRequestStore();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showPastCompleted, setShowPastCompleted] = useState(false);
  const [selectedCompleted, setSelectedCompleted] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayCompleted = completedTodos.filter(p => {
    if (!p.completedAt) return true;
    const ct = new Date(p.completedAt);
    return ct >= today && ct < tomorrow;
  });

  const pastCompleted = completedTodos.filter(p => {
    if (!p.completedAt) return false;
    const ct = new Date(p.completedAt);
    return ct < today;
  });

  const pastGrouped: Record<string, Post[]> = {};
  pastCompleted.forEach(p => {
    const dt = p.completedAt ? new Date(p.completedAt) : new Date();
    const key = dt.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
    if (!pastGrouped[key]) pastGrouped[key] = [];
    pastGrouped[key].push(p);
  });

  const CompletedRow = ({ p }: { p: Post }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const isWork = p.taskType === 'work';
    const isSelected = selectedCompleted.includes(p.id);
    return (
      <div
        style={{
          display: 'flex', gap: 8, padding: '6px 0',
          borderBottom: '1px solid #EDE5DC', alignItems: 'center',
          position: 'relative',
          background: isSelected ? '#FFF5F2' : 'transparent',
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {selectMode && canEdit && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {
              setSelectedCompleted(prev =>
                prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
              );
            }}
            style={{ flexShrink: 0, cursor: 'pointer', accentColor: '#C17B6B' }}
          />
        )}
        {!selectMode && canEdit && (
          <button
            onClick={async () => {
              await usePostStore.getState().updatePost(p.id, {
                completed: false,
                completedAt: null,
              });
              if (p.requestId) {
                await reactivateRequest(p.requestId);
              }
            }}
            style={{ fontSize: 10, color: '#C17B6B', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            title="할일로 복구"
          >
            ✓
          </button>
        )}
        <span style={{ fontSize: 11, color: '#9E8880', textDecoration: 'line-through', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.content}
        </span>
        <span style={{ fontSize: 9, padding: '1px 5px', background: isWork ? '#FFF5F2' : '#F5F0EE', color: isWork ? '#C17B6B' : '#9E8880', flexShrink: 0 }}>
          {isWork ? '업무' : '개인'}
        </span>
        <span style={{ fontSize: 10, color: '#C4B8B0', flexShrink: 0 }}>
          {p.completedAt ? formatTime(new Date(p.completedAt)) : '-'}
        </span>
        {showTooltip && !selectMode && (
          <div style={{
            position: 'absolute', bottom: '100%', right: 0,
            background: '#2C1810', color: '#FDF8F4',
            fontSize: 10, padding: '4px 8px', whiteSpace: 'nowrap',
            zIndex: 20, pointerEvents: 'none',
          }}>
            작성 {formatDateTime(new Date(p.createdAt))} → 완료 {p.completedAt ? formatDateTime(new Date(p.completedAt)) : '-'}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setShowCompleted(v => !v)}
        style={{ fontSize: 10, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', letterSpacing: '0.06em', display: 'block', width: '100%', textAlign: 'left' }}
      >
        {showCompleted ? '▲ 완료된 할일 숨기기' : `▼ 완료된 할일 보기 (${completedTodos.length})`}
      </button>

      {showCompleted && (
        <>
          {canEdit && completedTodos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, padding: '6px 0', alignItems: 'center', borderBottom: '1px solid #EDE5DC' }}>
              <button
                onClick={() => { setSelectMode(v => !v); setSelectedCompleted([]); }}
                style={{ fontSize: 10, color: selectMode ? '#C17B6B' : '#9E8880', background: 'none', border: `1px solid ${selectMode ? '#C17B6B' : '#EDE5DC'}`, cursor: 'pointer', padding: '2px 8px', letterSpacing: '0.04em' }}
              >
                {selectMode ? '선택 취소' : '선택'}
              </button>
              {selectMode && selectedCompleted.length > 0 && (
                <button
                  onClick={async () => {
                    for (const id of selectedCompleted) {
                      await usePostStore.getState().deletePost(id);
                    }
                    setSelectedCompleted([]);
                    setSelectMode(false);
                  }}
                  style={{ fontSize: 10, color: '#C17B6B', background: 'none', border: '1px solid #C17B6B', cursor: 'pointer', padding: '2px 8px' }}
                >
                  선택 삭제 ({selectedCompleted.length})
                </button>
              )}
              {!selectMode && (
                <button
                  onClick={async () => {
                    if (!window.confirm(`완료된 할일 ${completedTodos.length}개를 모두 삭제할까요?`)) return;
                    for (const p of completedTodos) {
                      await usePostStore.getState().deletePost(p.id);
                    }
                    setSelectedCompleted([]);
                    setSelectMode(false);
                  }}
                  style={{ fontSize: 10, color: '#C17B6B', background: 'none', border: '1px solid #C17B6B', cursor: 'pointer', padding: '2px 8px' }}
                >
                  전체 삭제 ({completedTodos.length})
                </button>
              )}
            </div>
          )}

          <div style={{ borderTop: '1px solid #EDE5DC', paddingTop: 4 }}>
            {todayCompleted.length === 0 && pastCompleted.length === 0 && (
              <p style={{ fontSize: 11, color: '#C4B8B0', padding: '8px 0' }}>완료된 할일이 없습니다</p>
            )}
            {todayCompleted.length > 0 && (
              <>
                <div style={{ fontSize: 10, color: '#C4B8B0', padding: '6px 0 2px', letterSpacing: '0.06em' }}>오늘</div>
                {todayCompleted.map(p => <CompletedRow key={p.id} p={p} />)}
              </>
            )}
            {pastCompleted.length > 0 && (
              <>
                <button
                  onClick={() => setShowPastCompleted(v => !v)}
                  style={{ fontSize: 10, color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', letterSpacing: '0.06em', display: 'block', width: '100%', textAlign: 'left', borderTop: todayCompleted.length > 0 ? '1px solid #EDE5DC' : 'none', marginTop: todayCompleted.length > 0 ? 4 : 0 }}
                >
                  {showPastCompleted ? '▲ 이전 완료 숨기기' : `▼ 이전 완료 보기 (${pastCompleted.length})`}
                </button>
                {showPastCompleted && Object.entries(pastGrouped).map(([date, items]) => (
                  <div key={date}>
                    <div style={{ fontSize: 10, color: '#C4B8B0', padding: '4px 0 2px', fontWeight: 600 }}>{date}</div>
                    {items.map(p => <CompletedRow key={p.id} p={p} />)}
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
