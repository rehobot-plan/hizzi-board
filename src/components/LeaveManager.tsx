'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import {
  calcAnnualLeave,
  calcRemainingLeave,
  calcUsedLeave,
  canViewLeaveLedger,
  LeaveEvent,
  LeaveType,
  useLeaveStore,
} from '@/store/leaveStore';

const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  full: '전일',
  half_am: '오전반차',
  half_pm: '오후반차',
};

const LEAVE_TYPE_DAYS: Record<LeaveType, number> = {
  full: 1,
  half_am: 0.5,
  half_pm: 0.5,
};

function isPastOrToday(dateStr: string): boolean {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return target <= today;
}

export default function LeaveManager() {
  const { user } = useAuthStore();
  const { users } = useUserStore();
  const { settings, events, upsertSetting, addLeaveEvent, updateLeaveEvent, deleteLeaveEvent } = useLeaveStore();

  const employees = useMemo(() => users.filter((u) => u.role !== 'admin'), [users]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [joinDateDraft, setJoinDateDraft] = useState('');
  const [manualUsedDraft, setManualUsedDraft] = useState('0');
  const [viewerDraft, setViewerDraft] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState<LeaveType>('full');
  const [formMemo, setFormMemo] = useState('');

  const selectedUser = useMemo(() => {
    if (!employees.length) return null;
    const targetId = selectedUserId || employees[0].id;
    return employees.find((u) => u.id === targetId) || employees[0];
  }, [employees, selectedUserId]);

  const setting = useMemo(() => {
    if (!selectedUser) return null;
    return settings.find((s) => s.userId === selectedUser.id) || null;
  }, [selectedUser, settings]);

  useEffect(() => {
    setJoinDateDraft(setting?.joinDate || '');
    setManualUsedDraft(String(setting?.manualUsedDays || 0));
    setViewerDraft((setting?.viewerEmails || []).join(', '));
  }, [setting?.joinDate, setting?.manualUsedDays, setting?.viewerEmails]);

  const userEvents = useMemo(() => {
    if (!selectedUser) return [];
    return events
      .filter((e) => e.userId === selectedUser.id)
      .slice()
      .sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [events, selectedUser]);

  const isAdmin = user?.role === 'admin';
  const canView = !!selectedUser && canViewLeaveLedger({
    targetUserId: selectedUser.id,
    currentEmail: user?.email,
    currentRole: user?.role,
    settings,
  });

  const canRegister = !!selectedUser && (
    isAdmin ||
    (user?.email && selectedUser.email === user.email) ||
    (setting?.viewerEmails || []).includes(user?.email || '')
  );

  const total = calcAnnualLeave(setting?.joinDate || '');
  const used = calcUsedLeave(userEvents, setting?.manualUsedDays || 0);
  const remain = calcRemainingLeave(setting?.joinDate || '', userEvents, setting?.manualUsedDays || 0);

  const applyDraftFromSetting = () => {
    setJoinDateDraft(setting?.joinDate || '');
    setManualUsedDraft(String(setting?.manualUsedDays || 0));
    setViewerDraft((setting?.viewerEmails || []).join(', '));
  };

  const openAddModal = () => {
    setFormDate('');
    setFormType('full');
    setFormMemo('');
    setEditTargetId(null);
    setShowAdd(true);
  };

  const openEditModal = (event: LeaveEvent) => {
    setFormDate(event.date);
    setFormType(event.type);
    setFormMemo(event.memo || '');
    setEditTargetId(event.id);
    setShowAdd(true);
  };

  const handleSaveSetting = async () => {
    if (!selectedUser || !isAdmin || !joinDateDraft) return;
    const viewerEmails = viewerDraft
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);

    await upsertSetting({
      userId: selectedUser.id,
      userName: selectedUser.name,
      joinDate: joinDateDraft,
      manualUsedDays: Number(manualUsedDraft) || 0,
      viewerEmails,
    });
  };

  const handleSaveLeave = async () => {
    if (!selectedUser || !formDate || !canRegister) return;
    const payload = {
      userId: selectedUser.id,
      userName: selectedUser.name,
      userEmail: selectedUser.email,
      date: formDate,
      type: formType,
      days: LEAVE_TYPE_DAYS[formType],
      memo: formMemo,
      createdBy: user?.email || '',
    };

    if (editTargetId) {
      const current = userEvents.find((e) => e.id === editTargetId);
      if (!current) return;
      const locked = current.confirmed || isPastOrToday(current.date);
      if (locked && !isAdmin) return;
      await updateLeaveEvent(editTargetId, payload);
    } else {
      await addLeaveEvent(payload);
    }

    setShowAdd(false);
  };

  const handleDelete = async (event: LeaveEvent) => {
    const locked = event.confirmed || isPastOrToday(event.date);
    if (locked && !isAdmin) return;
    await deleteLeaveEvent(event.id);
  };

  const onSelectEmployee = (nextUserId: string) => {
    setSelectedUserId(nextUserId);
    const nextSetting = settings.find((s) => s.userId === nextUserId);
    setJoinDateDraft(nextSetting?.joinDate || '');
    setManualUsedDraft(String(nextSetting?.manualUsedDays || 0));
    setViewerDraft((nextSetting?.viewerEmails || []).join(', '));
  };

  if (!employees.length) {
    return (
      <div className="border border-[#EDE5DC] bg-white rounded p-4">
        <h2 className="text-sm font-semibold text-[#2C1810] mb-2">연차 관리</h2>
        <p className="text-xs text-[#9E8880]">등록된 직원이 없습니다.</p>
      </div>
    );
  }

  // 관리자용 전체 연차 현황 테이블
  const leaveTableData = employees.map((emp) => {
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

  return (
    <div className="border border-[#EDE5DC] bg-white rounded p-4">
      <h2 className="text-sm font-semibold text-[#2C1810] mb-4">연차 관리</h2>

      {isAdmin && (
        <div className="mb-6 overflow-x-auto">
          <h3 className="text-xs font-semibold text-[#2C1810] mb-3">전체 직원 연차 현황</h3>
          <table className="w-full text-10px border-collapse">
            <thead>
              <tr style={{ borderBottom: `1px solid #EDE5DC`, background: '#FDF8F4' }}>
                <th className="px-2 py-2 text-left font-semibold text-[#2C1810]" style={{ fontSize: '10px' }}>이름</th>
                <th className="px-2 py-2 text-center font-semibold text-[#2C1810]" style={{ fontSize: '10px' }}>입사일</th>
                <th className="px-2 py-2 text-center font-semibold text-[#2C1810]" style={{ fontSize: '10px' }}>발생연차</th>
                <th className="px-2 py-2 text-center font-semibold text-[#2C1810]" style={{ fontSize: '10px' }}>수동입력</th>
                <th className="px-2 py-2 text-center font-semibold text-[#2C1810]" style={{ fontSize: '10px' }}>확정사용</th>
                <th className="px-2 py-2 text-center font-semibold text-[#2C1810]" style={{ fontSize: '10px' }}>총사용</th>
                <th className="px-2 py-2 text-center font-semibold text-[#2C1810]" style={{ fontSize: '10px' }}>잔여</th>
              </tr>
            </thead>
            <tbody>
              {leaveTableData.map((row) => (
                <tr key={row.id} style={{ borderBottom: `1px solid #EDE5DC` }}>
                  <td className="px-2 py-2 text-[#2C1810]" style={{ fontSize: '10px' }}>{row.name}</td>
                  <td className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '10px' }}>{row.joinDate}</td>
                  <td className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '10px' }}>{row.total}</td>
                  <td className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '10px' }}>{row.manualUsed}</td>
                  <td className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '10px' }}>{row.confirmedUsed}</td>
                  <td className="px-2 py-2 text-center text-[#2C1810]" style={{ fontSize: '10px' }}>{row.totalUsed}</td>
                  <td className="px-2 py-2 text-center" style={{ fontSize: '10px', color: row.remaining < 0 ? '#C17B6B' : '#2C1810', fontWeight: row.remaining < 0 ? 'bold' : 'normal' }}>
                    {row.remaining}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xs font-semibold text-[#2C1810] mb-3">개별 직원 관리</h3>
        <div className="flex gap-2 mb-4 flex-wrap">
        {employees.map((employee) => {
          const active = (selectedUser?.id || employees[0].id) === employee.id;
          return (
            <button
              key={employee.id}
              type="button"
              onClick={() => onSelectEmployee(employee.id)}
              className="px-3 py-1 text-xs border rounded"
              style={{
                borderColor: active ? '#2C1810' : '#EDE5DC',
                color: active ? '#2C1810' : '#9E8880',
                background: active ? '#FDF8F4' : '#fff',
              }}
            >
              {employee.name}
            </button>
          );
        })}
      </div>

      {!canView ? (
        <p className="text-xs text-[#9E8880]">이 직원의 연차 대장을 볼 권한이 없습니다.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-sm">
            <div className="border border-[#EDE5DC] p-3 rounded">
              <div className="text-[11px] text-[#9E8880] uppercase tracking-wider">입사일</div>
              {isAdmin ? (
                <input
                  type="date"
                  value={joinDateDraft}
                  onChange={(e) => setJoinDateDraft(e.target.value)}
                  className="w-full mt-1 border-b border-[#EDE5DC] bg-transparent outline-none text-[#2C1810]"
                />
              ) : (
                <div className="mt-1 text-[#2C1810]">{setting?.joinDate || '-'}</div>
              )}
            </div>
            <div className="border border-[#EDE5DC] p-3 rounded">
              <div className="text-[11px] text-[#9E8880] uppercase tracking-wider">기사용(수동)</div>
              {isAdmin ? (
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={manualUsedDraft}
                  onChange={(e) => setManualUsedDraft(e.target.value)}
                  className="w-full mt-1 border-b border-[#EDE5DC] bg-transparent outline-none text-[#2C1810]"
                />
              ) : (
                <div className="mt-1 text-[#2C1810]">{setting?.manualUsedDays || 0}일</div>
              )}
            </div>
            <div className="border border-[#EDE5DC] p-3 rounded">
              <div className="text-[11px] text-[#9E8880] uppercase tracking-wider">연차 현황</div>
              <div className="mt-1 text-[#2C1810] text-xs">발생 {total} / 사용 {used} / 잔여 {remain}</div>
            </div>
          </div>

          {isAdmin && (
            <div className="mb-4">
              <div className="text-[11px] text-[#9E8880] uppercase tracking-wider mb-1">열람자 이메일(쉼표 구분)</div>
              <input
                value={viewerDraft}
                onChange={(e) => setViewerDraft(e.target.value)}
                className="w-full border-b border-[#EDE5DC] bg-transparent outline-none text-xs text-[#2C1810] py-1"
                placeholder="viewer1@company.com, viewer2@company.com"
              />
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleSaveSetting}
                  className="px-3 py-1 text-xs border border-[#2C1810] text-[#2C1810] bg-[#FDF8F4]"
                >
                  설정 저장
                </button>
                <button
                  type="button"
                  onClick={applyDraftFromSetting}
                  className="px-3 py-1 text-xs text-[#9E8880] ml-2"
                >
                  원복
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-semibold text-[#2C1810]">연차 사용 내역</h3>
            {canRegister && (
              <button
                type="button"
                onClick={openAddModal}
                className="px-3 py-1 text-xs border border-[#C17B6B] text-[#C17B6B]"
              >
                + 연차 추가
              </button>
            )}
          </div>

          <div className="space-y-2">
            {userEvents.length === 0 && (
              <div className="text-xs text-[#9E8880] border border-[#EDE5DC] rounded p-3">등록된 연차가 없습니다.</div>
            )}
            {userEvents.map((event) => {
              const locked = event.confirmed || isPastOrToday(event.date);
              return (
                <div key={event.id} className="border border-[#EDE5DC] rounded p-3 text-xs flex justify-between items-center">
                  <div>
                    <div className="text-[#2C1810] font-medium">
                      {event.date} · {LEAVE_TYPE_LABEL[event.type]} ({event.days}일) {locked ? '🔒' : ''}
                    </div>
                    <div className="text-[#9E8880] mt-1">{event.memo || '-'} / 등록자: {event.createdBy || '-'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(event)}
                      disabled={locked && !isAdmin}
                      className="px-2 py-1 border border-[#EDE5DC] text-[#9E8880] disabled:opacity-40"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(event)}
                      disabled={locked && !isAdmin}
                      className="px-2 py-1 border border-[#C17B6B] text-[#C17B6B] disabled:opacity-40"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      </div>

      {showAdd && selectedUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white border border-[#EDE5DC] rounded w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-xs font-semibold text-[#2C1810] mb-3 uppercase tracking-widest">
              {editTargetId ? '연차 수정' : '연차 등록'}
            </h4>

            <label className="text-[11px] text-[#9E8880] block mb-1">대상자</label>
            <div className="text-sm text-[#2C1810] mb-3">{selectedUser.name}</div>

            <label className="text-[11px] text-[#9E8880] block mb-1">날짜</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full border-b border-[#EDE5DC] bg-transparent outline-none text-sm text-[#2C1810] mb-3"
            />

            <label className="text-[11px] text-[#9E8880] block mb-1">종류</label>
            <div className="flex gap-2 mb-3">
              {(Object.keys(LEAVE_TYPE_LABEL) as LeaveType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormType(type)}
                  className="px-2 py-1 text-xs border"
                  style={{
                    borderColor: formType === type ? '#2C1810' : '#EDE5DC',
                    color: formType === type ? '#2C1810' : '#9E8880',
                    background: formType === type ? '#FDF8F4' : '#fff',
                  }}
                >
                  {LEAVE_TYPE_LABEL[type]}
                </button>
              ))}
            </div>

            <label className="text-[11px] text-[#9E8880] block mb-1">메모</label>
            <input
              value={formMemo}
              onChange={(e) => setFormMemo(e.target.value)}
              className="w-full border-b border-[#EDE5DC] bg-transparent outline-none text-sm text-[#2C1810] mb-4"
              placeholder="선택 입력"
            />

            <div className="flex justify-between">
              <button type="button" onClick={() => setShowAdd(false)} className="text-xs text-[#9E8880]">취소</button>
              <button type="button" onClick={handleSaveLeave} className="px-3 py-1 text-xs bg-[#2C1810] text-[#FDF8F4]">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
