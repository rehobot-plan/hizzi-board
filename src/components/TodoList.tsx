'use client';

import { Post } from '@/store/postStore';
import TodoItem from './TodoItem';
import CompletedTodo from './CompletedTodo';

interface TodoListProps {
  panelId: string;
  ownerEmail?: string | null;
  posts: Post[];
  canEdit: boolean;
}

export default function TodoList({ panelId, ownerEmail, posts, canEdit }: TodoListProps) {
  const todoAll = posts.filter(p =>
    p.panelId === panelId && p.category === '할일'
  );

  const activeTodos = todoAll
    .filter(p => !p.completed)
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
    </>
  );
}
