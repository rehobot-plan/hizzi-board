'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import TabBar from '@/components/mydesk/TabBar';

export default function MyDeskLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  if (authLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }
  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col">
      <TabBar />
      <div className="px-8 pb-8">
        {children}
      </div>
    </div>
  );
}
