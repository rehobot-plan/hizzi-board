'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import {
  calcAnnualLeave,
  calcRemainingLeave,
  calcUsedLeave,
  useLeaveStore,
} from '@/store/leaveStore';

const LEAVE_TYPE_LABEL: Record<string, string> = {
  full: '전일',
  half_am: '오전반차',
  half_pm: '오후반차',
};

export default function LeavePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { users, loading: userLoading } = useUserStore();
  const { settings, events, loading: leaveLoading } = useLeaveStore();

  const currentUser = useMemo(
    () => users.find((u) => u.email === user?.email),
    [users, user?.email]
  );

  const leaveViewPermission = currentUser?.leaveViewPermission || 'none';

  const employees = useMemo(() => users.filter((u) => u.role !== 'admin'), [users]);

  // 모든 직원의 연차 데이터
  const leaveTableData = useMemo(() => {
    return employees.map((emp) => {
      const empSetting = settings.find((s) => s.userId === emp.id);
      const empEvents = events.filter((e) => e.userId === emp.id);
      const total = calcAnnualLeave(empSetting?.joinDate || '');
      const manualUsed = empSetting?.manualUsedDays || 0;
      const confirmedUsed = calcUsedLeave(empEvents, 0);
      const totalUsed = manualUsed + confirmedUsed;
      const remaining = calcRemainingLeave(empSetting?.joinDate || '', empEvents, manualUsed);
      return {
        id: emp.id,
        name: emp.name,
        joinDate: empSetting?.joinDate || '-',
        total: isNaN(total) ? 0 : total,
        manualUsed: isNaN(manualUsed) ? 0 : manualUsed,
        confirmedUsed: isNaN(confirmedUsed) ? 0 : confirmedUsed,
        totalUsed: isNaN(totalUsed) ? 0 : totalUsed,
        remaining: isNaN(remaining) ? 0 : remaining,
      };
    });
  }, [employees, settings, events]);

  // 본인 연차 정보
  const currentUserData = useMemo(() => {
    if (!currentUser) return null;
    const setting = settings.find((s) => s.userId === currentUser.id);
    const userEvents = events.filter((e) => e.userId === currentUser.id);
    const total = calcAnnualLeave(setting?.joinDate || '');
    const used = calcUsedLeave(userEvents, setting?.manualUsedDays || 0);
    const remain = calcRemainingLeave(setting?.joinDate || '', userEvents, setting?.manualUsedDays || 0);
    return {
      total: isNaN(total) ? 0 : total,
      used: isNaN(used) ? 0 : used,
      remain: isNaN(remain) ? 0 : remain,
      events: userEvents.slice().sort((a, b) => (a.date > b.date ? -1 : 1)),
    };
  }, [currentUser, settings, events]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || userLoading || leaveLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FDF8F4]">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (leaveViewPermission === 'none') {
    return (
      <div className="min-h-screen bg-[#FDF8F4] p-8">
        <button
          onClick={() => router.push('/')}
          className="mb-8 text-sm text-[#9E8880] hover:text-[#2C1810]"
        >
          ← 돌아가기
        </button>
        <div className="border border-[#EDE5DC] bg-white rounded p-8 text-center">
          <h1 className="text-lg font-semibold text-[#2C1810] mb-2">연차 열람 권한이 없습니다</h1>
          <p className="text-xs text-[#9E8880]">관리자에게 연차 열람 권한을 받아주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F4] p-8">
      <button
        onClick={() => router.push('/')}
        className="mb-8 text-sm text-[#9E8880] hover:text-[#2C1810]"
      >
        ← 돌아가기
      </button>

      {leaveViewPermission === 'self' ? (
        <div>
          <h1 className="text-2xl font-semibold text-[#2C1810] mb-6">내 연차</h1>

          {currentUserData && (
            <>
              {/* 연차 현황 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="border border-[#EDE5DC] p-4 rounded bg-white">
                  <div className="text-[11px] text-[#9E8880] uppercase tracking-wider mb-2">발생 연차</div>
                  <div className="text-3xl font-bold text-[#2C1810]">{currentUserData.total}</div>
                </div>
                <div className="border border-[#EDE5DC] p-4 rounded bg-white">
                  <div className="text-[11px] text-[#9E8880] uppercase tracking-wider mb-2">사용한 연차</div>
                  <div className="text-3xl font-bold text-[#2C1810]">{currentUserData.used}</div>
                </div>
                <div className="border border-[#EDE5DC] p-4 rounded bg-white">
                  <div className="text-[11px] text-[#9E8880] uppercase tracking-wider mb-2">잔여 연차</div>
                  <div
                    className="text-3xl font-bold"
                    style={{ color: currentUserData.remain < 0 ? '#C17B6B' : '#2C1810' }}
                  >
                    {currentUserData.remain}
                  </div>
                </div>
              </div>

              {/* 연차 사용 내역 */}
              <div className="border border-[#EDE5DC] bg-white rounded p-4">
                <h2 className="text-sm font-semibold text-[#2C1810] mb-4">연차 사용 내역</h2>
                {currentUserData.events.length === 0 ? (
                  <p className="text-xs text-[#9E8880]">등록된 연차가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {currentUserData.events.map((event) => (
                      <div
                        key={event.id}
                        className="border border-[#EDE5DC] rounded p-3 text-xs flex justify-between items-center"
                      >
                        <div>
                          <div className="text-[#2C1810] font-medium">
                            {event.date} · {LEAVE_TYPE_LABEL[event.type]} ({event.days}일)
                            {event.confirmed ? ' 🔒' : ''}
                          </div>
                          <div className="text-[#9E8880] mt-1">{event.memo || '-'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-semibold text-[#2C1810] mb-6">전체 직원 연차 현황</h1>
          <div className="overflow-x-auto">
            <table className="w-full text-10px border-collapse">
              <thead>
                <tr style={{ borderBottom: `1px solid #EDE5DC`, background: '#FDF8F4' }}>
                  <th className="px-3 py-2 text-left font-semibold text-[#2C1810]" style={{ fontSize: '11px' }}>
                    이름
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-[#2C1810]" style={{ fontSize: '11px' }}>
                    입사일
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-[#2C1810]" style={{ fontSize: '11px' }}>
                    발생
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-[#2C1810]" style={{ fontSize: '11px' }}>
                    수동입력
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-[#2C1810]" style={{ fontSize: '11px' }}>
                    확정사용
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-[#2C1810]" style={{ fontSize: '11px' }}>
                    총사용
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-[#2C1810]" style={{ fontSize: '11px' }}>
                    잔여
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaveTableData.map((row) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid #EDE5DC` }}>
                    <td className="px-3 py-2 text-[#2C1810]" style={{ fontSize: '11px' }}>
                      {row.name}
                    </td>
                    <td className="px-3 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>
                      {row.joinDate}
                    </td>
                    <td className="px-3 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>
                      {row.total}
                    </td>
                    <td className="px-3 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>
                      {row.manualUsed}
                    </td>
                    <td className="px-3 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>
                      {row.confirmedUsed}
                    </td>
                    <td className="px-3 py-2 text-center text-[#2C1810]" style={{ fontSize: '11px' }}>
                      {row.totalUsed}
                    </td>
                    <td
                      className="px-3 py-2 text-center"
                      style={{
                        fontSize: '11px',
                        color: row.remaining < 0 ? '#C17B6B' : '#2C1810',
                        fontWeight: row.remaining < 0 ? 'bold' : 'normal',
                      }}
                    >
                      {row.remaining}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
