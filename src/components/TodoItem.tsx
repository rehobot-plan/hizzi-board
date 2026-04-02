'use client';

import { useState } from 'react';
import { Post, usePostStore } from '@/store/postStore';

interface TodoItemProps {
  post: Post;
  canEdit: boolean;
}

export default function TodoItem({ post, canEdit }: TodoItemProps) {
  const { updatePost, deletePost } = usePostStore();
  const [checking, setChecking] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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
    // 0.6초 시각적 피드백 후 완료 처리
    setTimeout(async () => {
      await updatePost(post.id, {
        completed: true,
        completedAt: new Date(),
      });
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
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      padding: '10px 0',
      borderBottom: '1px solid #EDE5DC',
      borderLeft: post.starred ? '2px solid #C17B6B' : '2px solid transparent',
      paddingLeft: post.starred ? 8 : 0,
      opacity: justChecked ? 0.4 : 1,
      transition: 'opacity 0.5s ease, transform 0.5s ease',
      transform: justChecked ? 'translateX(8px)' : 'translateX(0)',
      position: 'relative',
    }}>
      {/* 별표 */}
      {canEdit && (
        <button
          onClick={handleStar}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, fontSize: 14,
            color: post.starred ? '#C17B6B' : '#EDE5DC',
            flexShrink: 0, marginTop: 1,
            transition: 'color 0.2s',
          }}
        >
          ★
        </button>
      )}

      {/* 체크박스 */}
      {canEdit && (
        <button
          onClick={handleCheck}
          disabled={checking || justChecked}
          style={{
            width: 16, height: 16,
            border: `1.5px solid ${justChecked ? '#C17B6B' : '#EDE5DC'}`,
            background: justChecked ? '#C17B6B' : '#fff',
            cursor: justChecked ? 'default' : 'pointer',
            flexShrink: 0, marginTop: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
        >
          {justChecked && (
            <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>
          )}
        </button>
      )}

      {/* 내용 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, lineHeight: 1.5,
          textDecoration: justChecked ? 'line-through' : 'none',
          color: justChecked ? '#9E8880' : '#2C1810',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          transition: 'all 0.3s ease',
        }}>
          {post.content}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 9, padding: '1px 6px', background: tagBg, color: tagColor, letterSpacing: '0.06em' }}>
            {tagLabel}
          </span>
          <span style={{ fontSize: 10, color: '#C4B8B0' }}>
            {formatDate(post.createdAt)}
          </span>
          {justChecked && (
            <span style={{ fontSize: 10, color: '#C17B6B', letterSpacing: '0.04em' }}>
              완료 ✓
            </span>
          )}
        </div>
      </div>

      {/* 더보기 메뉴 */}
      {canEdit && !justChecked && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowMenu(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#C4B8B0', fontSize: 16, padding: '4px 8px', lineHeight: 1,
            }}
          >
            ···
          </button>
          {showMenu && (
            <div
              style={{
                position: 'absolute', right: 0, top: 24,
                background: '#fff', border: '1px solid #EDE5DC',
                zIndex: 10, minWidth: 80,
              }}
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={handleDelete}
                style={{
                  display: 'block', width: '100%', padding: '7px 12px',
                  textAlign: 'left', fontSize: 11, color: '#C17B6B',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FFF5F2')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                삭제
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
