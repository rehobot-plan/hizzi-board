'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import RequestView from '@/components/request/RequestView';

export default function RequestPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }
  if (!user) return null;

  return <RequestView />;
}
