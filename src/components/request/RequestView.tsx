'use client';

import { useEffect } from 'react';
import { useUserStore, initUserListener } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';
import { initRequestListener } from '@/store/todoRequestStore';
import RequestList from '@/components/request/RequestList';

export default function RequestView() {
  const { user } = useAuthStore();
  const { loading: userLoading } = useUserStore();

  useEffect(() => {
    if (user?.email) {
      const cleanupUsers = initUserListener();
      const cleanupRequests = initRequestListener(user.email);
      return () => {
        cleanupUsers();
        cleanupRequests();
      };
    }
  }, [user?.email]);

  if (userLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex-1 p-8">
      <h1 className="text-2xl font-semibold text-[#2C1810] mb-6">요청 관리</h1>
      <RequestList />
    </div>
  );
}
