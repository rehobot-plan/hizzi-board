'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { useLeaveStore, LeaveType, LeaveEvent } from '@/store/leaveStore';
import { initLeaveListener } from '@/store/leaveStore';
import { useUserStore } from '@/store/userStore';
import { initUserListener } from '@/store/userStore';
import { useTodoRequestStore } from '@/store/todoRequestStore';
import { useCalendarStore, initCalendarListener } from '@/store/calendarStore';
import { useEscClose } from '@/hooks/useEscClose';
import {
  buildCalendarEventInputs, CalendarEventDoc, CalendarEventInput,
  getEventColor, DAY_KEYS, buildRepeatDates, buildDateRange,
  filterCalendarInputs,
} from '@/lib/calendar-helpers';
import type { CalendarCategory } from '@/lib/calendar-helpers';
import { CalendarFormState, CalendarEvent, DeleteConfirmTarget } from './calendar-types';
import { calendarEvent } from '@/styles/tokens';
import CalendarGrid from './CalendarGrid';
import { AddEventModal, DetailModal, LeaveDetailModal, DeleteConfirmModal } from './CalendarModals';
import CalendarFilter from './CalendarFilter';
import { useCalendarFilter, type CalendarScope } from '@/hooks/useCalendarFilter';

interface CalendarContainerProps {
  defaultScope?: CalendarScope;
  /** 블록 ⑤ 패널 내부 렌더 모드 — 나만/전체 이진 토글 · 기존 CalendarFilter 숨김. */
  panelMode?: boolean;
  /** 패널 소유자 이메일 (main-ux.md 5.2). isOwnPanel 계산용. */
  panelOwnerEmail?: string;
  /** 패널 FAB 클릭 시 증가 — 외부 트리거로 AddEventModal 오픈 (달력 탭 FAB 분기). */
  openAddSignal?: number;
}

export default function CalendarContainer({
  defaultScope = 'team',
  panelMode = false,
  panelOwnerEmail,
  openAddSignal,
}: CalendarContainerProps = {}) {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { events: leaveEvents, addLeaveEvent, updateLeaveEvent, deleteLeaveEvent } = useLeaveStore();
  const { users } = useUserStore();
  const { requests } = useTodoRequestStore();

  const currentAppUser = users.find(u => u.email === user?.email);
  const canSelectLeaveTarget = user?.role === 'admin' || currentAppUser?.leaveViewPermission === 'all';

  // ─── Firestore 데이터 ─────────────────────────────────
  const calendarEvents = useCalendarStore(s => s.events);
  const [eventInputs, setEventInputs] = useState<CalendarEventInput[]>([]);

  useEffect(() => {
    const cleanupUser = initUserListener();
    const cleanupLeave = initLeaveListener();
    const cleanupCalendar = initCalendarListener();
    return () => { cleanupUser(); cleanupLeave(); cleanupCalendar(); };
  }, []);

  useEffect(() => {
    setEventInputs(buildCalendarEventInputs(calendarEvents, leaveEvents));
  }, [calendarEvents, leaveEvents]);

  // ─── 필터 (Phase 4-A) ─────────────────────────────────
  // 블록 ⑤-1 간소화: 본인 패널만 월 그리드 렌더. 타인 패널은 placeholder(아래 early return) → scope·privacy 복잡 분기 원천 제거.
  // ⑤-3(별도 세션)에서 visibleTo 기반 정교한 접근 제어 모델 재설계 예정.
  const isOwnPanel = !!(panelMode && panelOwnerEmail && user?.email && panelOwnerEmail === user.email);
  const [panelScope, setPanelScope] = useState<CalendarScope>(() => {
    if (!panelMode) return defaultScope;
    return 'me';
  });
  // auth hydrate 지연 시 isOwnPanel이 false→true로 바뀌어도 '나만' 기본값 고정(사용자 수동 전환 후엔 override 금지).
  const panelScopeUserTouchedRef = useRef(false);
  useEffect(() => {
    if (!panelMode) return;
    if (panelScopeUserTouchedRef.current) return;
    setPanelScope('me');
  }, [panelMode, isOwnPanel]);
  const effectiveScope: CalendarScope = panelMode ? panelScope : defaultScope;
  const filter = useCalendarFilter(effectiveScope);
  // ⑤-3 — 타인 패널 visiting 모드: members=[panelOwnerEmail] 고정. unassigned panel(panelOwnerEmail 부재)이면 빈 멤버로 가드(자기 일정 누수 방지).
  // 본인 패널: scope 기반 members(me=본인 / team=전체). localStorage 이전 members 무시.
  const effectiveMembers = useMemo(() => {
    if (panelMode) {
      if (!isOwnPanel) return panelOwnerEmail ? [panelOwnerEmail] : [];
      if (panelScope === 'me' && user?.email) return [user.email];
      return users.map(u => u.email).filter((e): e is string => !!e);
    }
    return filter.members;
  }, [panelMode, isOwnPanel, panelOwnerEmail, panelScope, user?.email, users, filter.members]);
  const PANEL_ALL_CATEGORIES: CalendarCategory[] = ['work', 'request', 'personal'];
  const effectiveCategories = useMemo(
    () => (panelMode ? PANEL_ALL_CATEGORIES : filter.categories),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panelMode, filter.categories],
  );
  const filteredInputs = useMemo(() => {
    const base = filterCalendarInputs(eventInputs, {
      members: effectiveMembers,
      categories: effectiveCategories,
      users: users.map(u => ({ id: u.id, email: u.email, name: u.name })),
      currentUserEmail: user?.email || undefined,
      currentUserUid: user?.uid || undefined,
      isAdmin: user?.role === 'admin',
      // ⑤-3 — 타인 패널 visiting 모드: admin 특권 무시 + 'me' 전면 차단 + requestId visibleTo 강제.
      panelVisitingViewer: panelMode && !isOwnPanel,
    });
    // 본인 패널 '전체' scope에서 타인의 private(visibility='me')은 차단(team fall-through 방지).
    // specific은 CalendarEventDoc에 visibleTo 필드 부재 — 보수적으로 author=본인만 허용(⑤-3에서 정제).
    // panelMode + 본인 패널 + team scope: 남의 private('me') 이벤트 제외.
    // #18 2단계 — authorId(uid) 우선, authorEmail·email 레거시 fallback.
    if (panelMode && panelScope === 'team' && (user?.uid || user?.email)) {
      return base.filter(ev => {
        if (ev.extendedProps?.source !== 'calendar') return true;
        const raw = ev.extendedProps?.rawCalendar as CalendarEventDoc | undefined;
        if (!raw?.visibility || raw.visibility === 'all') return true;
        if (raw.visibility === 'specific') return true; // specific reader는 filterCalendarInputs가 처리
        if (user?.uid && raw.authorId === user.uid) return true;
        if (user?.email && (raw.authorEmail === user.email || raw.authorId === user.email)) return true;
        return false;
      });
    }
    return base;
  }, [eventInputs, effectiveMembers, effectiveCategories, users, panelMode, panelScope, user?.uid, user?.email, user?.role]);

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
  // #18 2단계 — uid/email 이원 대조. authorId(uid) 우선, 레거시 authorId=email·새 authorEmail 두 fallback.
  const canEditCalendar = (ev: CalendarEvent) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.uid && ev.authorId === user.uid) return true;
    const evEmail = (ev as unknown as { authorEmail?: string }).authorEmail;
    if (user.email && (evEmail === user.email || ev.authorId === user.email)) return true;
    return false;
  };

  const canEditLeave = (ev: LeaveEvent) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const isPast = new Date(ev.date + 'T00:00:00') <= new Date(new Date().toDateString());
    if (isPast || ev.confirmed) return false;
    return !!(user.email && (ev.userEmail === user.email || ev.createdBy === user.email));
  };

  // 외부 트리거(Panel FAB) — openAddSignal 증가 시 오늘 날짜 prefill로 AddEventModal 오픈.
  useEffect(() => {
    if (openAddSignal === undefined || openAddSignal === 0) return;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const ymd = `${y}-${m}-${d}`;
    openAddModal(ymd, ymd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAddSignal]);

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
        await addDoc(collection(db, 'calendarEvents'), { title: form.title, startDate: form.startDate, endDate: form.endDate, authorId: user?.uid, authorEmail: user?.email, authorName: user?.displayName || user?.email, color: form.color, createdAt: new Date(), updatedAt: new Date(), repeat: { type: 'none' } });
        addToast('일정이 추가되었습니다.');
      } else {
        const dates = buildRepeatDates(form.startDate, { repeatType, weeklyDay, excludeHolidays, endType, endDate, endCount });
        if (dates.length === 0) { addToast('생성할 일정이 없습니다.'); setLoading(false); return; }
        const groupId = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        for (const ds of dates) {
          await addDoc(collection(db, 'calendarEvents'), { title: form.title, startDate: ds, endDate: ds, authorId: user?.uid, authorEmail: user?.email, authorName: user?.displayName || user?.email, color: form.color, createdAt: new Date(), updatedAt: new Date(), repeat: { type: repeatType, weeklyDay, excludeHolidays, endType, endDate, endCount }, repeatGroupId: groupId });
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
  // ⑤-3 — 타인 패널 visiting 모드: 월 그리드 + 읽기 전용. ⑤-1 placeholder 제거.
  // 쓰기 진입점(AddEventModal · onDateClick · onDateRangeSelect · canEditCalendar/Leave) 전면 차단.
  const isWriteAllowed = !panelMode || isOwnPanel;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 0 8px', gap: 8 }}>
        {/* 블록 ⑤ 본인 패널 scope 이진 토글 (나만/전체). 타인 패널/비-panelMode에선 미노출. */}
        {panelMode && isOwnPanel && (
          <div
            data-testid="calendar-scope-toggle"
            style={{ display: 'flex', border: '1px solid #EDE5DC', borderRadius: 4, overflow: 'hidden' }}
          >
            {([
              { value: 'me' as CalendarScope, label: '나만' },
              { value: 'team' as CalendarScope, label: '전체' },
            ]).map(opt => {
              const active = panelScope === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-testid={`calendar-scope-${opt.value}`}
                  onClick={() => { panelScopeUserTouchedRef.current = true; setPanelScope(opt.value); }}
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    color: active ? '#2C1810' : '#9E8880',
                    background: active ? '#F6EFE7' : '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
        {/* panelMode에서는 기존 담당자·카테고리 필터 숨김(월 네비 옆 scope 토글로 대체). */}
        {!panelMode && (
          <CalendarFilter
            members={filter.members}
            onMembersChange={filter.setMembers}
            categories={filter.categories}
            onCategoriesChange={filter.setCategories}
            allMembers={users}
            scope={effectiveScope}
            myEmail={user?.email || ''}
            onResetDefaults={filter.resetDefaults}
            onPersist={filter.persist}
          />
        )}
      </div>
      <CalendarGrid
        events={filteredInputs}
        onDateClick={isWriteAllowed ? (ds) => openAddModal(ds, ds) : undefined}
        onDateRangeSelect={isWriteAllowed ? (s, e) => openAddModal(s, e) : undefined}
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
        canEdit={isWriteAllowed && (showDetail ? canEditCalendar(showDetail) : false)}
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
        canEdit={isWriteAllowed && (showLeaveDetail ? canEditLeave(showLeaveDetail) : false)}
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
