'use client';

import { Post, usePostStore } from '@/store/postStore';
import TodoItem from './TodoItem';
import CompletedTodo from './CompletedTodo';
import DeletedTodo from './DeletedTodo';

interface TodoListProps {
  panelId: string;
  ownerEmail?: string | null;
  posts: Post[];
  canEdit: boolean;
  activeFilter?: ('업무' | '요청' | '개인')[];
}

export default function TodoList({ panelId, ownerEmail, posts, canEdit, activeFilter = ['업무', '요청'] }: TodoListProps) {
  const { posts: allPosts } = usePostStore();
  const todoAll = posts.filter(p =>
    p.panelId === panelId && p.category === '할일' && !p.deleted
  );
  const deletedTodos = allPosts.filter(p =>
    p.panelId === panelId && p.category === '할일' && p.deleted === true
  );

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
      if (a.starred && b.starred) {
        const aT = a.starredAt ? new Date(a.starredAt).getTime() : 0;
        const bT = b.starredAt ? new Date(b.starredAt).getTime() : 0;
        return bT - aT;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const completedTodos = todoAll
    .filter(p => p.completed)
    .sort((a, b) => {
      const aT = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bT = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bT - aT;
    });

  return (
    <>
      {activeTodos.length === 0 && (
        <p className="text-[#C1B6A6] text-center text-xs py-4">할일이 없습니다</p>
      )}
      {activeTodos.map(post => (
        <TodoItem key={post.id} post={post} canEdit={canEdit} />
      ))}
      <CompletedTodo completedTodos={completedTodos} canEdit={canEdit} />
      <DeletedTodo deletedTodos={deletedTodos} canEdit={canEdit} />
    </>
  );
}
