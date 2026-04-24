'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initPostListener } from '@/store/postStore';
import { initCalendarListener } from '@/store/calendarStore';
import { initUserListener } from '@/store/userStore';
import { initRequestListener } from '@/store/todoRequestStore';
import { useAuthStore } from '@/store/authStore';
import { useTodaySummary } from '@/hooks/useTodaySummary';
import SummaryCard from '@/components/mydesk/SummaryCard';
import UrgentList from '@/components/mydesk/UrgentList';

export default function TodayPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user?.email) return;
    const c1 = initPostListener();
    const c2 = initCalendarListener();
    const c3 = initUserListener();
    const c4 = initRequestListener(user.email);
    return () => { c1(); c2(); c3(); c4(); };
  }, [user?.email]);

  const { counts, urgentItems } = useTodaySummary();

  return (
    <div>
      {/* 요약 카드 4개 — mydesk.md §3.1 (R-3) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="할일"
          value={counts.todoToday}
          subLabel="오늘 기한"
          accentColor="#C17B6B"
          onClick={() => router.push('/mydesk/todo')}
        />
        <SummaryCard
          title="일정"
          value={counts.eventToday}
          subLabel={`이번 주 ${counts.eventThisWeek}`}
          accentColor="#3B6D11"
          onClick={() => router.push('/')}
        />
        <SummaryCard
          title="요청"
          value={counts.receivedPending}
          subLabel={`보낸 대기 ${counts.sentPending} · 진행 중 ${counts.inProgress}`}
          accentColor="#993556"
          onClick={() => router.push('/mydesk/request')}
        />
        <SummaryCard
          title="overdue"
          value={counts.overdue}
          subLabel="미완료"
          accentColor="#A32D2D"
          onClick={() => router.push('/mydesk/todo')}
        />
      </div>

      {/* 시급 리스트 */}
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#2C1810', marginBottom: 12 }}>지금 봐야 할 것</h2>
      </div>
      <UrgentList items={urgentItems} />
    </div>
  );
}
