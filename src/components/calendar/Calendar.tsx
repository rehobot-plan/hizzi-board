'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { useLeaveStore, LeaveType } from '@/store/leaveStore';
import { useUserStore } from '@/store/userStore';
import { useEscClose } from '@/hooks/useEscClose';
import {
  buildCalendarEventInputs, CalendarEventDoc, CalendarEventInput,
  getEventColor, DAY_KEYS, buildRepeatDates, buildDateRange,
} from '@/lib/calendar-helpers';
import { CalendarFormState } from './calendar-types';
import CalendarGrid from './CalendarGrid';
import { AddEventModal } from './CalendarModals';

export default function CalendarContainer() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { events: leaveEvents, addLeaveEvent } = useLeaveStore();
  const { users } = useUserStore();

  const currentAppUser = users.find(u => u.email === user?.email);
  const canSelectLeaveTarget = user?.role === 'admin' || currentAppUser?.leaveViewPermission === 'all';

  // ─── Firestore 데이터 ─────────────────────────────────
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventDoc[]>([]);
  const [eventInputs, setEventInputs] = useState<CalendarEventInput[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'calendarEvents'), orderBy('startDate'));
    return onSnapshot(q, snap => {
      setCalendarEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })) as CalendarEventDoc[]);
    });
  }, []);

  useEffect(() => {
    setEventInputs(buildCalendarEventInputs(calendarEvents, leaveEvents));
  }, [calendarEvents, leaveEvents]);

  // ─── 추가 모달 상태 ───────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<CalendarFormState>({
    title: '', startDate: '', endDate: '', color: getEventColor(),
    _taskType: 'work', _visibility: 'all',
  });
  const [addMode, setAddMode] = useState<'calendar' | 'leave'>('calendar');
  const [leaveTargetUserId, setLeaveTargetUserId] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('full');
  const [leaveMemo, setLeaveMemo] = useState('');
  const [repeatType, setRepeatType] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [weeklyDay, setWeeklyDay] = useState('');
  const [excludeHolidays, setExcludeHolidays] = useState(true);
  const [endType, setEndType] = useState<'forever' | 'date' | 'count'>('forever');
  const [endDate, setEndDate] = useState('');
  const [endCount, setEndCount] = useState(10);
  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEscClose(() => setShowAdd(false), showAdd);

  // ─── 모달 열기 ────────────────────────────────────────
  const openAddModal = (startStr: string, endStr: string) => {
    const d = new Date(startStr + 'T00:00:00');
    setSelectedStartDate(startStr);
    setSelectedEndDate(endStr);
    setWeeklyDay(DAY_KEYS[d.getDay()]);
    setForm({
      title: '', startDate: startStr, endDate: endStr, color: getEventColor(),
      _taskType: 'work', _visibility: 'all',
    });
    setAddMode('calendar');
    setLeaveTargetUserId(currentAppUser?.id || '');
    setLeaveType('full');
    setLeaveMemo('');
    setRepeatType('none');
    setEndType('forever');
    setEndDate('');
    setEndCount(10);
    setExcludeHolidays(true);
    setShowAdd(true);
  };

  // ─── 추가 핸들러 ─────────────────────────────────────
  const handleAdd = async () => {
    if (addMode === 'leave') {
      const rangeStart = selectedStartDate || form.startDate;
      const rangeEnd = selectedEndDate || form.endDate || form.startDate;
      if (!rangeStart || !user) return;

      const effectiveTargetUserId = canSelectLeaveTarget ? leaveTargetUserId : (currentAppUser?.id || '');
      if (!effectiveTargetUserId) return;

      const target = users.find(u => u.id === effectiveTargetUserId);
      if (!target) return;

      const isAdmin = user.role === 'admin';
      const isSelf = user.email && user.email === target.email;
      if (!isAdmin && !isSelf) {
        addToast('본인 또는 관리자만 연차를 등록할 수 있습니다.');
        return;
      }

      setLoading(true);
      try {
        const dates = buildDateRange(rangeStart, rangeEnd);
        for (const ds of dates) {
          await addLeaveEvent({
            userId: target.id,
            userName: target.name,
            userEmail: target.email,
            date: ds,
            type: leaveType,
            days: leaveType === 'full' ? 1 : 0.5,
            memo: leaveMemo || undefined,
            createdBy: user.email || '',
          });
        }
        addToast(dates.length + '일 연차가 등록되었습니다.');
        setShowAdd(false);
      } catch {
        addToast('연차 등록 실패');
      }
      setLoading(false);
      return;
    }

    // 일반 일정
    if (!form.title.trim() || !form.startDate || !form.endDate) return;
    setLoading(true);
    try {
      if (repeatType === 'none') {
        const doc: Record<string, unknown> = {
          title: form.title,
          startDate: form.startDate,
          endDate: form.endDate,
          authorId: user?.uid,
          authorName: user?.displayName || user?.email,
          color: form.color,
          createdAt: new Date(),
          repeat: { type: 'none' },
        };
        await addDoc(collection(db, 'calendarEvents'), doc);
        addToast('일정이 추가되었습니다.');
      } else {
        const dates = buildRepeatDates(form.startDate, {
          repeatType, weeklyDay, excludeHolidays, endType, endDate, endCount,
        });
        if (dates.length === 0) { addToast('생성할 일정이 없습니다.'); setLoading(false); return; }
        const groupId = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        for (const ds of dates) {
          const doc: Record<string, unknown> = {
            title: form.title,
            startDate: ds,
            endDate: ds,
            authorId: user?.uid,
            authorName: user?.displayName || user?.email,
            color: form.color,
            createdAt: new Date(),
            repeat: { type: repeatType, weeklyDay, excludeHolidays, endType, endDate, endCount },
            repeatGroupId: groupId,
          };
          await addDoc(collection(db, 'calendarEvents'), doc);
        }
        addToast(dates.length + '개 일정이 추가되었습니다.');
      }
      setShowAdd(false);
    } catch {
      addToast('추가 실패');
    }
    setLoading(false);
  };

  // ─── 렌더 ─────────────────────────────────────────────
  return (
    <>
      <CalendarGrid
        events={eventInputs}
        onDateClick={ds => openAddModal(ds, ds)}
        onDateRangeSelect={(s, e) => openAddModal(s, e)}
      />
      <AddEventModal
        open={showAdd}
        form={form}
        setForm={setForm}
        addMode={addMode}
        setAddMode={setAddMode}
        selectedStartDate={selectedStartDate}
        selectedEndDate={selectedEndDate}
        leaveTargetUserId={leaveTargetUserId}
        setLeaveTargetUserId={setLeaveTargetUserId}
        canSelectLeaveTarget={canSelectLeaveTarget}
        users={users}
        currentAppUser={currentAppUser}
        currentUserDisplay={currentAppUser?.name || user?.displayName || user?.email || '본인'}
        leaveType={leaveType}
        setLeaveType={setLeaveType}
        leaveMemo={leaveMemo}
        setLeaveMemo={setLeaveMemo}
        repeatType={repeatType}
        setRepeatType={setRepeatType}
        weeklyDay={weeklyDay}
        setWeeklyDay={setWeeklyDay}
        excludeHolidays={excludeHolidays}
        setExcludeHolidays={setExcludeHolidays}
        endType={endType}
        setEndType={setEndType}
        endDate={endDate}
        setEndDate={setEndDate}
        endCount={endCount}
        setEndCount={setEndCount}
        loading={loading}
        onCancel={() => setShowAdd(false)}
        onSubmit={handleAdd}
      />
    </>
  );
}
