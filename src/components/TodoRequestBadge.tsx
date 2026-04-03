'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTodoRequestStore, initRequestListener } from '@/store/todoRequestStore';

export default function TodoRequestBadge() {
  const { user } = useAuthStore();
  const { requests } = useTodoRequestStore();

  useEffect(() => {
    if (!user?.email) return;
    const cleanup = initRequestListener(user.email);
    return cleanup;
  }, [user?.email]);

  const pendingCount = requests.filter(
    (r) => r.status === 'pending' && r.toEmail === user?.email
  ).length;

  if (pendingCount <= 0) return null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 20,
        height: 20,
        padding: '0 6px',
        border: '1px solid #C17B6B',
        background: '#FFF5F2',
        color: '#C17B6B',
        fontSize: 10,
        letterSpacing: '0.06em',
      }}
      title="대기 중인 할일 요청"
    >
      {pendingCount}
    </span>
  );
}
