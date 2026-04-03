'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTodoRequestStore, initRequestListener } from '@/store/todoRequestStore';
import TodoRequestModal from './TodoRequestModal';

export default function TodoRequestBadge() {
  const { user } = useAuthStore();
  const { requests } = useTodoRequestStore();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    const cleanup = initRequestListener(user.email);
    return cleanup;
  }, [user?.email]);

  const isAdmin = user?.role === 'admin';
  const pendingCount = requests.filter(r => {
    if (r.status !== 'pending') return false;
    if (isAdmin) return true; // 관리자는 모든 pending 요청 보기
    return r.toEmail === user?.email; // 일반 사용자는 받은 요청만
  }).length;

  const hasAny = requests.some(
    r => r.fromEmail === user?.email || r.toEmail === user?.email
  );

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'relative',
          background: 'none',
          border: '1px solid #EDE5DC',
          cursor: 'pointer',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          transition: 'all 0.15s ease',
          color: pendingCount > 0 ? '#C17B6B' : '#9E8880',
          borderColor: pendingCount > 0 ? '#C17B6B' : '#EDE5DC',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#C17B6B';
          e.currentTarget.style.color = '#C17B6B';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = pendingCount > 0 ? '#C17B6B' : '#EDE5DC';
          e.currentTarget.style.color = pendingCount > 0 ? '#C17B6B' : '#9E8880';
        }}
        title="할일 요청함"
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M2 2h10v8H8l-2 2-2-2H2V2z" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
        {pendingCount > 0 && (
          <span style={{
            background: '#C17B6B',
            color: '#fff',
            borderRadius: '50%',
            width: 15,
            height: 15,
            fontSize: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}>
            {pendingCount}
          </span>
        )}
      </button>
      {showModal && <TodoRequestModal onClose={() => setShowModal(false)} />}
    </>
  );
}
