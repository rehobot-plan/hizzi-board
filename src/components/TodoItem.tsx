'use client';

import { useState } from 'react';
import { Post, usePostStore } from '@/store/postStore';

interface TodoItemProps {
  post: Post;
  canEdit: boolean;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7L7 1z"
      stroke="#C17B6B" strokeWidth="1.2" fill={filled ? '#C17B6B' : 'none'} />
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function TodoItem({ post, canEdit }: TodoItemProps) {
  const { updatePost, deletePost } = usePostStore();
  const [checking, setChecking] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isWork = post.taskType === 'work';
  const tagColor = isWork ? '#C17B6B' : '#9E8880';
  const tagBg = isWork ? '#FFF5F2' : '#F5F0EE';
  const tagLabel = isWork ? '업무' : '개인';

  const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  };

  const handleCheck = async () => {
    if (!canEdit || checking || justChecked) return;
    setJustChecked(true);
    setChecking(true);
    setTimeout(async () => {
      await updatePost(post.id, { completed: true, completedAt: new Date() });
      setChecking(false);
    }, 600);
  };

  const handleStar = async () => {
    if (!canEdit) return;
    await updatePost(post.id, {
      starred: !post.starred,
      starredAt: post.starred ? null : new Date(),
    });
  };

  const handleDelete = async () => {
    if (!canEdit) return;
    await deletePost(post.id);
    setShowMenu(false);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '10px 0 10px 8px',
        borderBottom: '1px solid #EDE5DC',
        position: 'relative',
        opacity: justChecked ? 0.4 : 1,
        transition: 'opacity 0.5s ease, transform 0.5s ease, background 0.15s ease',
        transform: justChecked ? 'translateX(8px)' : 'translateX(0)',
        background: isHovered && !justChecked ? '#FDF8F4' : '#fff',
      }}
    >
      {/* 별표 선 레이어 */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 2,
        background: post.starred ? '#C17B6B' : 'transparent',
        transition: 'background 0.15s ease',
        pointerEvents: 'none',
      }} />

      {/* 별표 버튼 */}
      {canEdit && (
        <button onClick={handleStar}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', transition: 'opacity 0.15s ease' }}>
          <StarIcon filled={!!post.starred} />
        </button>
      )}

      {/* 체크박스 */}
      {canEdit && (
        <button onClick={handleCheck} disabled={checking || justChecked}
          style={{ width: 16, height: 16, border: `1.5px solid ${justChecked ? '#C17B6B' : '#EDE5DC'}`, background: justChecked ? '#C17B6B' : '#fff', cursor: justChecked ? 'default' : 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}>
          {justChecked && <CheckIcon />}
        </button>
      )}

      {/* 내용 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, lineHeight: 1.5, textDecoration: justChecked ? 'line-through' : 'none', color: justChecked ? '#9E8880' : '#2C1810', whiteSpace: 'pre-wrap', wordBreak: 'break-word', transition: 'all 0.15s ease' }}>
          {post.content}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 9, padding: '1px 6px', background: tagBg, color: tagColor, letterSpacing: '0.06em' }}>{tagLabel}</span>
          <span style={{ fontSize: 10, color: '#C4B8B0' }}>{formatDate(post.createdAt)}</span>
          {justChecked && <span style={{ fontSize: 10, color: '#C17B6B', letterSpacing: '0.04em' }}>완료</span>}
        </div>
      </div>

      {/* 더보기 메뉴 */}
      {canEdit && !justChecked && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowMenu(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4B8B0', fontSize: 16, padding: '8px 12px', lineHeight: 1, margin: '-8px -12px', transition: 'color 0.15s ease' }}>
            ···
          </button>
          {showMenu && (
            <div style={{ position: 'absolute', right: 0, top: 24, background: '#fff', border: '1px solid #EDE5DC', zIndex: 100, minWidth: 80, boxShadow: '0 4px 12px rgba(44,20,16,0.08)' }}
              onMouseLeave={() => setShowMenu(false)}>
              <button onClick={handleDelete}
                style={{ display: 'block', width: '100%', padding: '7px 12px', textAlign: 'left', fontSize: 11, color: '#C17B6B', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FFF5F2')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                삭제
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
