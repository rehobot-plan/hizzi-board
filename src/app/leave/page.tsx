'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { calcAnnualLeave, calcUsedLeave, useLeaveStore } from '@/store/leaveStore';

const LEAVE_TYPE_LABEL: Record<string, string> = {
  full: '전일',
  half_am: '오전반차',
  half_pm: '오후반차',
};

export default function LeavePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { users, loading: usersLoading } = useUserStore();
  const { settings, events, loading: leaveLoading } = useLeaveStore();

  const currentAppUser = useMemo(() => users.find((u) => u.email === user?.email), [users, user?.email]);
  const permission = currentAppUser?.leaveViewPermission;

  const mySetting = useMemo(() => {
    if (!currentAppUser) return null;
    return settings.find((s) => s.userId === currentAppUser.id) || null;
  }, [currentAppUser, settings]);

  const myEvents = useMemo(() => {
    if (!currentAppUser) return [];
    return events
      .filter((e) => e.userId === currentAppUser.id)
      .slice()
      .sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [events, currentAppUser]);

  const myTotal = calcAnnualLeave(mySetting?.joinDate || '');
  const myUsed = calcUsedLeave(myEvents, mySetting?.manualUsedDays || 0);
  const myRemain = myTotal - myUsed;

  const employees = useMemo(() => users.filter((u) => u.role !== 'admin'), [users]);

  const leaveTableData = useMemo(() => {
    return employees.map((emp) => {
      const empSetting = settings.find((s) => s.userId === emp.id);
      const empEvents = events.filter((e) => e.userId === emp.id);
      const total = calcAnnualLeave(empSetting?.joinDate || '');
      const manualUsed = Number(empSetting?.manualUsedDays) || 0;
      const confirmedUsed = calcUsedLeave(empEvents, 0);
      const totalUsed = manualUsed + confirmedUsed;
      const remain = total - totalUsed;

      return {
        id: emp.id,
        name: emp.name,
        joinDate: empSetting?.joinDate || '-',
        total,
        manualUsed,
        confirmedUsed,
        totalUsed,
        remain,
      };
    });
  }, [employees, settings, events]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || usersLoading || leaveLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FDF8F4]">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FDF8F4] px-4 md:px-8 py-8">
      <button
        type="button"
        onClick={() => router.push('/')}
        className="text-xs text-[#9E8880] hover:text-[#2C1810] mb-6"
      >
        ← 돌아가기
      </button>

      {!permission || permission === 'none' ? (
        <div className="border border-[#EDE5DC] bg-white rounded p-4">
          <h2 className="text-sm font-semibold text-[#2C1810] mb-2">연차 사용 내역</h2>
          <p className="text-xs text-[#9E8880]">권한이 없습니다.</p>
        </div>
      ) : permission === 'me' ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[#2C1810]">내 연차 현황</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="border border-[#EDE5DC] p-3 rounded bg-white">
              <div className="text-[11px] text-[#9E8880] uppercase tracking-wider">발생</div>
              <div className="mt-1 text-[#2C1810]">{myTotal}</div>
            </div>
            <div className="border border-[#EDE5DC] p-3 rounded bg-white">
              <div className="text-[11px] text-[#9E8880] uppercase tracking-wider">사용</div>
              <div className="mt-1 text-[#2C1810]">{myUsed}</div>
            </div>
            <div className="border border-[#EDE5DC] p-3 rounded bg-white">
              <div className="text-[11px] text-[#9E8880] uppercase tracking-wider">잔여</div>
              <div className="mt-1" style={{ color: myRemain < 0 ? '#C17B6B' : '#2C1810' }}>{myRemain}</div>
            </div>
          </div>

          <div className="border border-[#EDE5DC] bg-white rounded p-4">
            <h3 className="text-xs font-semibold text-[#2C1810] mb-2">연차 사용 내역</h3>
            <div className="space-y-2">
              {myEvents.length === 0 && (
                <div className="text-xs text-[#9E8880] border border-[#EDE5DC] rounded p-3">등록된 연차가 없습니다.</div>
              )}
              {myEvents.map((event) => (
                <div key={event.id} className="border border-[#EDE5DC] rounded p-3 text-xs flex justify-between items-center">
                  <div>
                    <div className="text-[#2C1810] font-medium">
                      {event.date} · {LEAVE_TYPE_LABEL[event.type]} ({event.days}일) {event.confirmed ? '🔒' : ''}
                    </div>
                    <div className="text-[#9E8880] mt-1">{event.memo || '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-[#EDE5DC] bg-white rounded p-4 overflow-x-auto">
          <h2 className="text-sm font-semibold text-[#2C1810] mb-3">전체 직원 연차 현황</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid #EDE5DC', background: '#FDF8F4' }}>
                <th className="px-2 py-2 text-left text-[#2C1810]" style={{ fontSize: '11px' }}>이름</th>
                <th className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>입사일</th>
                <th className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>발생</th>
                <th className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>수동사용</th>
                <th className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>확정사용</th>
                <th className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>총사용</th>
                <th className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>잔여</th>
              </tr>
            </thead>
            <tbody>
              {leaveTableData.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #EDE5DC' }}>
                  <td className="px-2 py-2 text-[#2C1810]" style={{ fontSize: '11px' }}>{row.name}</td>
                  <td className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>{row.joinDate}</td>
                  <td className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>{row.total}</td>
                  <td className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>{row.manualUsed}</td>
                  <td className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>{row.confirmedUsed}</td>
                  <td className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>{row.totalUsed}</td>
                  <td
                    className="px-2 py-2 text-center"
                    style={{
                      fontSize: '11px',
                      color: row.remain < 0 ? '#C17B6B' : '#2C1810',
                      fontWeight: row.remain < 0 ? 'bold' : 'normal',
                    }}
                  >
                    {row.remain}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
