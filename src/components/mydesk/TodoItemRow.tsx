'use client';

import { Post } from '@/store/postStore';
import { todoLeftBorderColor, postLeftBorderColor } from '@/lib/leftBorderColor';
import { tagColors } from '@/styles/tokens';
import { daysUntil, isToday } from '@/lib/dateUtils';
import { SegmentType } from './TodoSegment';

export type ItemMode = 'todo' | 'memo';

interface Props {
  post: Post;
  segment: SegmentType;
  selected: boolean;
  onSelect: (id: string) => void;
  onComplete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onClick?: () => void;
  mode?: ItemMode;
}

export default function TodoItemRow({ post, segment, selected, onSelect, onComplete, onRestore, onPermanentDelete, onClick, mode = 'todo' }: Props) {
  const borderColor = mode === 'memo' ? postLeftBorderColor(post) : todoLeftBorderColor(post);
  const isRequest = !!post.requestFrom;
  const catLabel = isRequest ? '요청' : post.taskType === 'personal' ? '개인' : '업무';
  const catColor = isRequest ? tagColors.category.request : post.taskType === 'personal' ? tagColors.category.personal : tagColors.category.work;

  const visLabel = !post.visibleTo || post.visibleTo.length === 0 ? '전체'
    : post.visibleTo.length === 1 ? '나만' : '특정';
  const visColor = !post.visibleTo || post.visibleTo.length === 0 ? tagColors.visibility.all
    : post.visibleTo.length === 1 ? tagColors.visibility.meOnly : tagColors.visibility.specific;

  const daysDiff = (d: Date | undefined) => {
    if (!d) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diff === 0 ? '오늘' : `${diff}일 전`;
  };

  return (
    <div
      data-testid={`todo-row-${post.id}`}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: selected ? '#FDF8F4' : '#fff',
        border: selected ? '1px solid #C17B6B' : '1px solid #EDE5DC',
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 4, padding: '10px 14px',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#FDF8F4'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = '#fff'; }}
    >
      {/* 체크박스 — 메모에서는 숨김 */}
      {mode === 'todo' && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(post.id)}
          onClick={e => e.stopPropagation()}
          style={{ cursor: 'pointer', accentColor: '#C17B6B' }}
        />
      )}

      {/* 제목 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, color: '#2C1810',
          textDecoration: segment === 'completed' ? 'line-through' : 'none',
          opacity: segment === 'trash' ? 0.5 : 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {post.starred && <span style={{ marginRight: 4 }}>⭐</span>}
          {post.content}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 2, background: catColor.bg, color: catColor.fg, border: `1px solid ${catColor.fg}` }}>
            {catLabel}
          </span>
          <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 2, color: visColor.fg, border: `1px solid ${visColor.border}` }}>
            {visLabel}
          </span>
        </div>
      </div>

      {/* 우측 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {mode === 'todo' && segment === 'active' && post.dueDate && (
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
            background: isToday(post.dueDate) ? '#C17B6B' : '#FFF5F2',
            color: isToday(post.dueDate) ? '#fff' : '#C17B6B',
          }}>
            {isToday(post.dueDate) ? '오늘' : `D-${Math.max(0, daysUntil(post.dueDate))}`}
          </span>
        )}
        {segment === 'completed' && (
          <>
            <span style={{ fontSize: 10, color: '#9E8880' }}>완료 {daysDiff(post.completedAt || undefined)}</span>
            {onRestore && (
              <button onClick={e => { e.stopPropagation(); onRestore(post.id); }}
                style={{ fontSize: 10, color: '#3B6D11', background: 'none', border: 'none', cursor: 'pointer' }}>
                되돌리기
              </button>
            )}
          </>
        )}
        {segment === 'trash' && (
          <>
            <span style={{ fontSize: 10, color: '#9E8880' }}>삭제 {daysDiff(post.deletedAt || undefined)}</span>
            {onRestore && (
              <button onClick={e => { e.stopPropagation(); onRestore(post.id); }}
                style={{ fontSize: 10, color: '#3B6D11', background: 'none', border: 'none', cursor: 'pointer' }}>
                복원
              </button>
            )}
            {onPermanentDelete && (
              <button onClick={e => { e.stopPropagation(); onPermanentDelete(post.id); }}
                style={{ fontSize: 10, color: '#C17B6B', background: 'none', border: 'none', cursor: 'pointer' }}>
                영구삭제
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
