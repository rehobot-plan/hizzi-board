'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { useLeaveStore, LeaveType, LeaveEvent } from '@/store/leaveStore';
import { initLeaveListener } from '@/store/leaveStore';
import { useUserStore } from '@/store/userStore';
import { initUserListener } from '@/store/userStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import { useEscClose } from '@/hooks/useEscClose';
import {
  buildCalendarEventInputs, CalendarEventDoc, CalendarEventInput,
  getEventColor, DAY_KEYS, buildRepeatDates, buildDateRange,
} from '@/lib/calendar-helpers';
import { CalendarFormState, CalendarEvent, DeleteConfirmTarget } from './calendar-types';
import { calendarEvent } from '@/styles/tokens';
import CalendarGrid from './CalendarGrid';
import { AddEventModal, DetailModal, LeaveDetailModal, DeleteConfirmModal } from './CalendarModals';

export default function CalendarContainer() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { events: leaveEvents, addLeaveEvent, updateLeaveEvent, deleteLeaveEvent } = useLeaveStore();
  const { users } = useUserStore();
  const { requests } = useTodoRequestStore();

  const currentAppUser = users.find(u => u.email === user?.email);
  const canSelectLeaveTarget = user?.role === 'admin' || currentAppUser?.leaveViewPermission === 'all';

  // ─── Firestore 데이터 ─────────────────────────────────
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventDoc[]>([]);
  const [eventInputs, setEventInputs] = useState<CalendarEventInput[]>([]);

  useEffect(() => {
    const cleanupUser = initUserListener();
    const cleanupLeave = initLeaveListener();
    return () => { cleanupUser(); cleanupLeave(); };
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'calendarEvents'), orderBy('startDate'));
    return onSnapshot(q, snap => {
      setCalendarEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })) as CalendarEventDoc[]);
    });
  }, []);

  useEffect(() => {
    setEventInputs(buildCalendarEventInputs(calendarEvents, leaveEvents));
  }, [calendarEvents, leaveEvents]);

  // ─── 공통 상태 ────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CalendarFormState>({
    title: '', startDate: '', endDate: '', color: getEventColor(),
    _taskType: 'work', _visibility: 'all',
  });

  // ─── 추가 모달 상태 ───────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
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

  // ─── 상세/삭제 모달 상태 ──────────────────────────────
  const [showDetail, setShowDetail] = useState<CalendarEvent | null>(null);
  const [showLeaveDetail, setShowLeaveDetail] = useState<LeaveEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmTarget>(null);

  // ─── ESC 닫기 (우선순위: deleteConfirm > leaveDetail > detail > add) ─
  const anyModalOpen = showAdd || !!showDetail || !!showLeaveDetail || !!deleteConfirm;
  useEscClose(() => {
    if (deleteConfirm) { setDeleteConfirm(null); return; }
    if (showLeaveDetail) { setShowLeaveDetail(null); return; }
    if (showDetail) { setShowDetail(null); return; }
    if (showAdd) { setShowAdd(false); return; }
  }, anyModalOpen);

  // ─── 권한 ─────────────────────────────────────────────
  const canEditCalendar = (ev: CalendarEvent) =>
    !!(user && (user.role === 'admin' || user.uid === ev.authorId));

  const canEditLeave = (ev: LeaveEvent) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const isPast = new Date(ev.date + 'T00:00:00') <= new Date(new Date().toDateString());
    if (isPast || ev.confirmed) return false;
    return !!(user.email && (ev.userEmail === user.email || ev.createdBy === user.email));
  };

  // ─── 모달 열기 ────────────────────────────────────────
  const openAddModal = (startStr: string, endStr: string) => {
    const d = new Date(startStr + 'T00:00:00');
    setSelectedStartDate(startStr);
    setSelectedEndDate(endStr);
    setWeeklyDay(DAY_KEYS[d.getDay()]);
    setForm({ title: '', startDate: startStr, endDate: endStr, color: getEventColor(), _taskType: 'work', _visibility: 'all' });
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

  const openDisplayEvent = (eventId: string, extendedProps: Record<string, unknown>) => {
    const source = extendedProps.source as string;
    if (source === 'calendar') {
      const raw = extendedProps.rawCalendar as CalendarEventDoc | undefined;
      if (!raw) return;
      const ev = raw as unknown as CalendarEvent;
      setForm({ title: ev.title, startDate: ev.startDate, endDate: ev.endDate, color: ev.color, _taskType: 'work', _visibility: 'all' });
      setShowLeaveDetail(null);
      setShowDetail(ev);
    } else if (source === 'leave') {
      const raw = extendedProps.rawLeave as LeaveEvent | undefined;
      if (!raw) return;
      setForm({ title: '', startDate: raw.date, endDate: raw.date, color: calendarEvent.leave.border, _taskType: 'work', _visibility: 'all' });
      setLeaveType(raw.type || 'full');
      setLeaveMemo(raw.memo || '');
      setShowDetail(null);
      setShowLeaveDetail(raw);
    }
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
      if (user.role !== 'admin' && !(user.email && user.email === target.email)) {
        addToast('본인 또는 관리자만 연차를 등록할 수 있습니다.');
        return;
      }
      setLoading(true);
      try {
        const dates = buildDateRange(rangeStart, rangeEnd);
        for (const ds of dates) {
          await addLeaveEvent({ userId: target.id, userName: target.name, userEmail: target.email, date: ds, type: leaveType, days: leaveType === 'full' ? 1 : 0.5, memo: leaveMemo || undefined, createdBy: user.email || '' });
        }
        addToast(dates.length + '일 연차가 등록되었습니다.');
        setShowAdd(false);
      } catch { addToast('연차 등록 실패'); }
      setLoading(false);
      return;
    }
    if (!form.title.trim() || !form.startDate || !form.endDate) return;
    setLoading(true);
    try {
      if (repeatType === 'none') {
        await addDoc(collection(db, 'calendarEvents'), { title: form.title, startDate: form.startDate, endDate: form.endDate, authorId: user?.uid, authorName: user?.displayName || user?.email, color: form.color, createdAt: new Date(), repeat: { type: 'none' } });
        addToast('일정이 추가되었습니다.');
      } else {
        const dates = buildRepeatDates(form.startDate, { repeatType, weeklyDay, excludeHolidays, endType, endDate, endCount });
        if (dates.length === 0) { addToast('생성할 일정이 없습니다.'); setLoading(false); return; }
        const groupId = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        for (const ds of dates) {
          await addDoc(collection(db, 'calendarEvents'), { title: form.title, startDate: ds, endDate: ds, authorId: user?.uid, authorName: user?.displayName || user?.email, color: form.color, createdAt: new Date(), repeat: { type: repeatType, weeklyDay, excludeHolidays, endType, endDate, endCount }, repeatGroupId: groupId });
        }
        addToast(dates.length + '개 일정이 추가되었습니다.');
      }
      setShowAdd(false);
    } catch { addToast('추가 실패'); }
    setLoading(false);
  };

  // ─── 수정 핸들러 ─────────────────────────────────────
  const handleUpdate = async () => {
    if (!showDetail || !form.title.trim()) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'calendarEvents', showDetail.id), { title: form.title, startDate: form.startDate, endDate: form.endDate, color: form.color });
      setShowDetail(null);
      addToast('수정되었습니다.');
    } catch { addToast('수정 실패'); }
    setLoading(false);
  };

  const handleLeaveUpdate = async () => {
    if (!showLeaveDetail) return;
    setLoading(true);
    try {
      await updateLeaveEvent(showLeaveDetail.id, { date: form.startDate, type: leaveType, days: leaveType === 'full' ? 1 : 0.5, memo: leaveMemo || undefined });
      setShowLeaveDetail(null);
      addToast('연차가 수정되었습니다.');
    } catch { addToast('연차 수정 실패'); }
    setLoading(false);
  };

  // ─── 삭제 핸들러 ─────────────────────────────────────
  const handleDeleteSingle = (ev: CalendarEvent) => setDeleteConfirm({ type: 'single', target: ev });
  const handleDeleteRepeat = (ev: CalendarEvent) => setDeleteConfirm({ type: 'repeat', target: ev });
  const handleLeaveDelete = (ev: LeaveEvent) => setDeleteConfirm({ type: 'leave', target: ev });

  const executeDeleteSingle = async (ev: CalendarEvent) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'calendarEvents', ev.id));
      setShowDetail(null);
      addToast('삭제되었습니다.');
    } catch { addToast('삭제 실패'); }
    setLoading(false);
  };

  const executeDeleteRepeat = async (ev: CalendarEvent) => {
    if (!ev.repeatGroupId) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'calendarEvents'));
      const toDelete = snap.docs.filter(d => {
        const data = d.data();
        return data.repeatGroupId === ev.repeatGroupId && data.startDate >= ev.startDate;
      });
      for (const e of toDelete) await deleteDoc(doc(db, 'calendarEvents', e.id));
      setShowDetail(null);
      addToast(toDelete.length + '개 일정이 삭제되었습니다.');
    } catch { addToast('삭제 실패'); }
    setLoading(false);
  };

  const executeLeaveDelete = async (ev: LeaveEvent) => {
    setLoading(true);
    try {
      await deleteLeaveEvent(ev.id);
      setShowLeaveDetail(null);
      addToast('연차가 삭제되었습니다.');
    } catch { addToast('연차 삭제 실패'); }
    setLoading(false);
  };

  const executeDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'single') await executeDeleteSingle(deleteConfirm.target);
    if (deleteConfirm.type === 'repeat') await executeDeleteRepeat(deleteConfirm.target);
    if (deleteConfirm.type === 'leave') await executeLeaveDelete(deleteConfirm.target);
    setDeleteConfirm(null);
  };

  // ─── 렌더 ─────────────────────────────────────────────
  return (
    <>
      <CalendarGrid
        events={eventInputs}
        onDateClick={ds => openAddModal(ds, ds)}
        onDateRangeSelect={(s, e) => openAddModal(s, e)}
        onEventClick={openDisplayEvent}
      />
      <AddEventModal
        open={showAdd}
        form={form} setForm={setForm}
        addMode={addMode} setAddMode={setAddMode}
        selectedStartDate={selectedStartDate} selectedEndDate={selectedEndDate}
        leaveTargetUserId={leaveTargetUserId} setLeaveTargetUserId={setLeaveTargetUserId}
        canSelectLeaveTarget={canSelectLeaveTarget}
        users={users} currentAppUser={currentAppUser}
        currentUserDisplay={currentAppUser?.name || user?.displayName || user?.email || '본인'}
        leaveType={leaveType} setLeaveType={setLeaveType}
        leaveMemo={leaveMemo} setLeaveMemo={setLeaveMemo}
        repeatType={repeatType} setRepeatType={setRepeatType}
        weeklyDay={weeklyDay} setWeeklyDay={setWeeklyDay}
        excludeHolidays={excludeHolidays} setExcludeHolidays={setExcludeHolidays}
        endType={endType} setEndType={setEndType}
        endDate={endDate} setEndDate={setEndDate}
        endCount={endCount} setEndCount={setEndCount}
        loading={loading}
        onCancel={() => setShowAdd(false)} onSubmit={handleAdd}
      />
      <DetailModal
        open={!!showDetail}
        event={showDetail}
        form={form} setForm={setForm}
        canEdit={showDetail ? canEditCalendar(showDetail) : false}
        requests={requests} users={users}
        loading={loading}
        onCancel={() => setShowDetail(null)}
        onUpdate={handleUpdate}
        onDeleteSingle={handleDeleteSingle}
        onDeleteRepeat={handleDeleteRepeat}
      />
      <LeaveDetailModal
        open={!!showLeaveDetail}
        leaveEvent={showLeaveDetail}
        form={form} setForm={setForm}
        leaveType={leaveType} setLeaveType={setLeaveType}
        leaveMemo={leaveMemo} setLeaveMemo={setLeaveMemo}
        canEdit={showLeaveDetail ? canEditLeave(showLeaveDetail) : false}
        loading={loading}
        onCancel={() => setShowLeaveDetail(null)}
        onUpdate={handleLeaveUpdate}
        onDelete={handleLeaveDelete}
      />
      <DeleteConfirmModal
        confirm={deleteConfirm}
        loading={loading}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={executeDeleteConfirm}
      />
    </>
  );
}
