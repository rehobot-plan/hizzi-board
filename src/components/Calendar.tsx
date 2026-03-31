'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';

const HOLIDAYS_2026 = [
  '2026-01-01','2026-01-28','2026-01-29','2026-01-30',
  '2026-03-01','2026-05-05','2026-05-15','2026-06-06',
  '2026-08-15','2026-09-24','2026-09-25','2026-09-26',
  '2026-10-03','2026-10-09','2026-12-25',
];

const HOLIDAY_NAMES: Record<string, string> = {
  '2026-01-01':'신정','2026-01-28':'설날연휴','2026-01-29':'설날연휴','2026-01-30':'설날연휴',
  '2026-03-01':'삼일절','2026-05-05':'어린이날','2026-05-15':'부처님오신날','2026-06-06':'현충일',
  '2026-08-15':'광복절','2026-09-24':'추석연휴','2026-09-25':'추석연휴','2026-09-26':'추석연휴',
  '2026-10-03':'개천절','2026-10-09':'한글날','2026-12-25':'크리스마스',
};

const COLORS = ['#81D8D0','#F4C0D1','#B5D4F4','#C0DD97','#FAC775','#F0997B','#AFA9EC','#D3D1C7'];

const DAY_NAMES = ['일','월','화','수','목','금','토'];
const DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];
const KOREAN_DAYS = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  authorId: string;
  color: string;
  createdAt: any;
  authorName?: string;
  repeatGroupId?: string;
}

function toDateStr(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonthMatrix(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const matrix: (Date | null)[][] = [];
  let day = 1 - firstDay.getDay();
  while (day <= lastDay.getDate()) {
    const week: (Date | null)[] = [];
    for (let i = 0; i < 7; i++, day++) {
      if (day < 1 || day > lastDay.getDate()) week.push(null);
      else week.push(new Date(year, month, day));
    }
    matrix.push(week);
  }
  return matrix;
}

function isHoliday(dateStr: string) {
  return HOLIDAYS_2026.includes(dateStr);
}

export default function Calendar() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [editYear, setEditYear] = useState(false);
  const [editMonth, setEditMonth] = useState(false);
  const [navYear, setNavYear] = useState(current.year.toString());
  const [navMonth, setNavMonth] = useState((current.month + 1).toString().padStart(2, '0'));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetail, setShowDetail] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', color: COLORS[0] });
  const [repeatType, setRepeatType] = useState<'none'|'daily'|'weekly'|'monthly'|'yearly'>('none');
  const [repeatExcludeHolidays, setRepeatExcludeHolidays] = useState(true);
  const [repeatEndType, setRepeatEndType] = useState<'forever'|'date'|'count'>('forever');
  const [repeatEndDate, setRepeatEndDate] = useState('');
  const [repeatEndCount, setRepeatEndCount] = useState(10);
  const [autoWeeklyDay, setAutoWeeklyDay] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'calendarEvents'), orderBy('startDate'));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as CalendarEvent)));
    });
    return unsub;
  }, []);

  const moveMonth = (diff: number) => {
    setCurrent(cur => {
      let m = cur.month + diff;
      let y = cur.year;
      while (m < 0) { m += 12; y--; }
      while (m > 11) { m -= 12; y++; }
      setNavYear(y.toString());
      setNavMonth((m + 1).toString().padStart(2, '0'));
      return { year: y, month: m };
    });
  };

  const changeYear = (diff: number) => {
    setCurrent(cur => {
      const y = cur.year + diff;
      setNavYear(y.toString());
      return { ...cur, year: y };
    });
  };

  const changeMonth = (diff: number) => {
    setCurrent(cur => {
      let m = cur.month + diff;
      let y = cur.year;
      while (m < 0) { m += 12; y--; }
      while (m > 11) { m -= 12; y++; }
      setNavYear(y.toString());
      setNavMonth((m + 1).toString().padStart(2, '0'));
      return { year: y, month: m };
    });
  };

  const handleYearBlur = () => {
    const y = parseInt(navYear, 10);
    if (!isNaN(y) && y > 1900 && y < 2100) setCurrent(c => ({ ...c, year: y }));
    else setNavYear(current.year.toString());
    setEditYear(false);
  };

  const handleMonthBlur = () => {
    const m = parseInt(navMonth, 10);
    if (!isNaN(m) && m >= 1 && m <= 12) setCurrent(c => ({ ...c, month: m - 1 }));
    else setNavMonth((current.month + 1).toString().padStart(2, '0'));
    setEditMonth(false);
  };

  const canEdit = (event: CalendarEvent) => {
    return user && (user.role === 'admin' || user.uid === event.authorId);
  };

  const getEventsForDay = (date: Date) => {
    const ds = toDateStr(date);
    return events.filter(ev => ev.startDate <= ds && ev.endDate >= ds);
  };

  const getRepeatDates = () => {
    const start = new Date(form.startDate);
    let endLimit = new Date(form.endDate);

    if (repeatEndType === 'date' && repeatEndDate) {
      endLimit = new Date(repeatEndDate);
    } else if (repeatEndType === 'forever') {
      endLimit = new Date(start);
      endLimit.setFullYear(start.getFullYear() + 1);
    }

    const dates: Date[] = [];
    let d = new Date(start);
    let count = 0;
    const maxCount = repeatEndType === 'count' ? repeatEndCount : 999;

    while (d <= endLimit && dates.length < maxCount) {
      if (repeatType === 'daily') {
        dates.push(new Date(d));
        d.setDate(d.getDate() + 1);
      } else if (repeatType === 'weekly') {
        const dayKey = DAY_KEYS[d.getDay()];
        if (!autoWeeklyDay || dayKey === autoWeeklyDay) {
          dates.push(new Date(d));
        }
        d.setDate(d.getDate() + 1);
      } else if (repeatType === 'monthly') {
        dates.push(new Date(d));
        d.setMonth(d.getMonth() + 1);
      } else if (repeatType === 'yearly') {
        dates.push(new Date(d));
        d.setFullYear(d.getFullYear() + 1);
      } else {
        break;
      }
      count++;
      if (count > 500) break;
    }
    return dates;
  };

  const handleAddEvent = async () => {
    if (!form.title.trim() || !form.startDate || !form.endDate) return;
    setLoading(true);
    try {
      if (repeatType === 'none') {
        await addDoc(collection(db, 'calendarEvents'), {
          title: form.title,
          startDate: form.startDate,
          endDate: form.endDate,
          authorId: user?.uid,
          authorName: user?.displayName || user?.email,
          color: form.color,
          createdAt: new Date(),
          repeat: { type: 'none' },
        });
      } else {
        const repeatGroupId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const dates = getRepeatDates();
        for (const d of dates) {
          if (repeatExcludeHolidays && isHoliday(toDateStr(d))) continue;
          await addDoc(collection(db, 'calendarEvents'), {
            title: form.title,
            startDate: toDateStr(d),
            endDate: toDateStr(d),
            authorId: user?.uid,
            authorName: user?.displayName || user?.email,
            color: form.color,
            createdAt: new Date(),
            repeat: { type: repeatType, excludeHolidays: repeatExcludeHolidays },
            repeatGroupId,
          });
        }
      }
      setShowAddModal(false);
      setForm({ title: '', startDate: '', endDate: '', color: COLORS[0] });
      setRepeatType('none');
      addToast('일정이 추가되었습니다.');
    } catch (e) {
      addToast('일정 추가 실패');
    }
    setLoading(false);
  };

  const handleUpdateEvent = async () => {
    if (!showDetail || !form.title.trim()) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'calendarEvents', showDetail.id), {
        title: form.title,
        startDate: form.startDate,
        endDate: form.endDate,
        color: form.color,
      });
      setShowDetail(null);
      addToast('일정이 수정되었습니다.');
    } catch (e) {
      addToast('일정 수정 실패');
    }
    setLoading(false);
  };

  const handleDeleteSingle = async (event: CalendarEvent) => {
    if (!confirm('이 일정을 삭제할까요?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'calendarEvents', event.id));
      setShowDetail(null);
      addToast('일정이 삭제되었습니다.');
    } catch (e) {
      addToast('삭제 실패');
    }
    setLoading(false);
  };

  const handleDeleteRepeat = async (event: CalendarEvent) => {
    if (!event.repeatGroupId) return;
    if (!confirm('이 날짜 이후의 반복 일정을 모두 삭제할까요?')) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'calendarEvents'));
      const toDelete = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(ev => ev.repeatGroupId === event.repeatGroupId && ev.startDate >= event.startDate);
      for (const ev of toDelete) {
        await deleteDoc(doc(db, 'calendarEvents', ev.id));
      }
      setShowDetail(null);
      addToast('반복 일정이 모두 삭제되었습니다.');
    } catch (e) {
      addToast('삭제 실패');
    }
    setLoading(false);
  };

  const onDateClick = (date: Date) => {
    const ds = toDateStr(date);
    const dayKey = DAY_KEYS[date.getDay()];
    setAutoWeeklyDay(dayKey);
    setForm({ title: '', startDate: ds, endDate: ds, color: COLORS[0] });
    setRepeatType('none');
    setRepeatEndType('forever');
    setRepeatEndDate('');
    setRepeatEndCount(10);
    setShowAddModal(true);
  };

  const onEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetail(event);
    setForm({ title: event.title, startDate: event.startDate, endDate: event.endDate, color: event.color });
  };

  const handleDragStart = (date: Date) => {
    setDragStart(date);
    setDragEnd(date);
    setIsDragging(true);
  };

  const handleDragEnter = (date: Date) => {
    if (isDragging) setDragEnd(date);
  };

  const handleDragEnd = () => {
    if (dragStart && dragEnd) {
      const start = dragStart < dragEnd ? dragStart : dragEnd;
      const end = dragStart > dragEnd ? dragStart : dragEnd;
      setAutoWeeklyDay(DAY_KEYS[start.getDay()]);
      setForm({ title: '', startDate: toDateStr(start), endDate: toDateStr(end), color: COLORS[0] });
      setRepeatType('none');
      setShowAddModal(true);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const isDragSelected = (date: Date) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    const start = dragStart < dragEnd ? dragStart : dragEnd;
    const end = dragStart > dragEnd ? dragStart : dragEnd;
    return date >= start && date <= end;
  };

  const today = new Date();
  let nextYear = current.year;
  let nextMonth = current.month + 1;
  if (nextMonth > 11) { nextMonth = 0; nextYear++; }

  const leftMatrix = getMonthMatrix(current.year, current.month);
  const rightMatrix = isMobile ? [] : getMonthMatrix(nextYear, nextMonth);

  const renderMonthCalendar = (matrix: (Date | null)[][], year: number, month: number) => {
    const monthLabel = `${year}년 ${month + 1}월`;
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#2C1810', marginBottom: 8, letterSpacing: '0.05em' }}>
          {monthLabel}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
          {DAY_NAMES.map((d, i) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', padding: '4px 0', color: i === 0 ? '#C17B6B' : i === 6 ? '#6B8BC1' : '#9E8880' }}>
              {d}
            </div>
          ))}
        </div>
        {matrix.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {week.map((date, di) => {
              if (!date) return <div key={di} style={{ minHeight: 70, borderBottom: '0.5px solid #EDE5DC', borderRight: '0.5px solid #EDE5DC' }} />;
              const ds = toDateStr(date);
              const isToday = ds === toDateStr(today);
              const isHol = isHoliday(ds);
              const isSun = di === 0;
              const isSat = di === 6;
              const dayEvs = getEventsForDay(date);
              const isDragSel = isDragSelected(date);
              return (
                <div
                  key={di}
                  onClick={() => onDateClick(date)}
                  onMouseDown={() => handleDragStart(date)}
                  onMouseEnter={() => handleDragEnter(date)}
                  onMouseUp={handleDragEnd}
                  style={{
                    minHeight: 70,
                    borderBottom: '0.5px solid #EDE5DC',
                    borderRight: '0.5px solid #EDE5DC',
                    padding: '4px 3px',
                    cursor: 'pointer',
                    background: isDragSel ? '#FFF5F2' : isToday ? '#FDF8F4' : '#fff',
                    userSelect: 'none',
                  }}
                >
                  <div style={{
                    fontSize: 11,
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? '#C17B6B' : isHol || isSun ? '#C17B6B' : isSat ? '#6B8BC1' : '#2C1810',
                    width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: isToday ? '50%' : 0,
                    background: isToday ? '#F5E6E0' : 'transparent',
                    marginBottom: 2,
                  }}>
                    {date.getDate()}
                  </div>
                  {isHol && HOLIDAY_NAMES[ds] && (
                    <div style={{ fontSize: 9, color: '#C17B6B', marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {HOLIDAY_NAMES[ds]}
                    </div>
                  )}
                  {dayEvs.slice(0, 2).map(ev => {
                    const isStart = ev.startDate === ds;
                    const isEnd = ev.endDate === ds;
                    const isSingle = ev.startDate === ev.endDate;
                    return (
                      <div
                        key={ev.id}
                        onClick={e => onEventClick(ev, e)}
                        style={{
                          fontSize: 10,
                          color: '#fff',
                          background: ev.color || '#C17B6B',
                          padding: '1px 4px',
                          marginBottom: 2,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          borderRadius: isSingle ? 3 : isStart ? '3px 0 0 3px' : isEnd ? '0 3px 3px 0' : 0,
                          marginLeft: isStart || isSingle ? 0 : -3,
                          marginRight: isEnd || isSingle ? 0 : -3,
                        }}
                      >
                        {isStart || isSingle ? ev.title : ''}
                      </div>
                    );
                  })}
                  {dayEvs.length > 2 && (
                    <div style={{ fontSize: 9, color: '#9E8880' }}>+{dayEvs.length - 2}개</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const repeatTypeLabel = () => {
    if (repeatType === 'none') return null;
    if (repeatType === 'weekly' && autoWeeklyDay) {
      const idx = DAY_KEYS.indexOf(autoWeeklyDay);
      return `매주 ${KOREAN_DAYS[idx]} 반복`;
    }
    if (repeatType === 'daily') return '매일 반복';
    if (repeatType === 'monthly') return '매월 반복';
    if (repeatType === 'yearly') return '매년 반복';
    return null;
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%' }}
      onMouseUp={handleDragEnd}
    >
      {/* 네비게이션 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #EDE5DC' }}>
        <button onClick={() => moveMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E8880', fontSize: 14, padding: '2px 6px' }}>‹</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => changeYear(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E8880', fontSize: 11 }}>‹</button>
          {editYear ? (
            <input
              value={navYear}
              onChange={e => setNavYear(e.target.value.replace(/[^0-9]/g,''))}
              onBlur={handleYearBlur}
              onKeyDown={e => e.key === 'Enter' && handleYearBlur()}
              autoFocus
              style={{ width: 50, border: 'none', borderBottom: '1px solid #C17B6B', textAlign: 'center', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent' }}
            />
          ) : (
            <span onClick={() => setEditYear(true)} style={{ fontSize: 13, fontWeight: 700, color: '#2C1810', cursor: 'pointer', letterSpacing: '0.05em' }}>{current.year}년</span>
          )}
          <button onClick={() => changeYear(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E8880', fontSize: 11 }}>›</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E8880', fontSize: 11 }}>‹</button>
          {editMonth ? (
            <input
              value={navMonth}
              onChange={e => setNavMonth(e.target.value.replace(/[^0-9]/g,''))}
              onBlur={handleMonthBlur}
              onKeyDown={e => e.key === 'Enter' && handleMonthBlur()}
              autoFocus
              style={{ width: 32, border: 'none', borderBottom: '1px solid #C17B6B', textAlign: 'center', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent' }}
            />
          ) : (
            <span onClick={() => setEditMonth(true)} style={{ fontSize: 13, fontWeight: 700, color: '#2C1810', cursor: 'pointer' }}>{String(current.month + 1).padStart(2,'0')}월</span>
          )}
          <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E8880', fontSize: 11 }}>›</button>
        </div>

        <button onClick={() => moveMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E8880', fontSize: 14, padding: '2px 6px' }}>›</button>
      </div>

      {/* 달력 본체 */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #EDE5DC' }}>
        <div style={{ flex: 1, borderRight: isMobile ? 'none' : '1px solid #EDE5DC', padding: '8px 4px' }}>
          {renderMonthCalendar(leftMatrix, current.year, current.month)}
        </div>
        {!isMobile && (
          <div style={{ flex: 1, padding: '8px 4px' }}>
            {renderMonthCalendar(rightMatrix, nextYear, nextMonth)}
          </div>
        )}
      </div>

      {/* 일정 추가 모달 */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 440 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE5DC' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>일정 추가</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="일정 제목"
                style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', marginBottom: 14, fontFamily: 'inherit' }}
              />

              {/* 날짜 */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 6 }}>날짜</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
                  <span style={{ color: '#9E8880', fontSize: 11 }}>~</span>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
                </div>
              </div>

              {/* 반복 설정 */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 6 }}>반복 설정</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['none','daily','weekly','monthly','yearly'] as const).map(t => {
                    const labels = { none: '안함', daily: '매일', weekly: '매주', monthly: '매월', yearly: '매년' };
                    return (
                      <button key={t} onClick={() => setRepeatType(t)}
                        style={{ padding: '5px 10px', border: `1px solid ${repeatType === t ? '#C17B6B' : '#EDE5DC'}`, background: repeatType === t ? '#FFF5F2' : '#fff', color: repeatType === t ? '#C17B6B' : '#9E8880', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                        {labels[t]}
                      </button>
                    );
                  })}
                </div>

                {repeatType === 'weekly' && autoWeeklyDay && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#9E8880' }}>
                    {repeatTypeLabel()}
                  </div>
                )}

                {repeatType !== 'none' && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: '#9E8880' }}>공휴일 제외</span>
                      <div
                        onClick={() => setRepeatExcludeHolidays(v => !v)}
                        style={{ width: 32, height: 18, background: repeatExcludeHolidays ? '#C17B6B' : '#EDE5DC', borderRadius: 9, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                        <div style={{ position: 'absolute', top: 2, left: repeatExcludeHolidays ? 14 : 2, width: 14, height: 14, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#9E8880', marginBottom: 4 }}>종료</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      {(['forever','date','count'] as const).map(t => {
                        const labels = { forever: '무기한', date: '날짜 지정', count: '횟수 지정' };
                        return (
                          <button key={t} onClick={() => setRepeatEndType(t)}
                            style={{ padding: '4px 8px', border: `1px solid ${repeatEndType === t ? '#2C1810' : '#EDE5DC'}`, background: repeatEndType === t ? '#FDF8F4' : '#fff', color: repeatEndType === t ? '#2C1810' : '#9E8880', fontSize: 10, cursor: 'pointer' }}>
                            {labels[t]}
                          </button>
                        );
                      })}
                    </div>
                    {repeatEndType === 'date' && (
                      <input type="date" value={repeatEndDate} onChange={e => setRepeatEndDate(e.target.value)}
                        style={{ border: 'none', borderBottom: '1px solid #EDE5DC', padding: '4px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
                    )}
                    {repeatEndType === 'count' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="number" value={repeatEndCount} min={1} max={200} onChange={e => setRepeatEndCount(Number(e.target.value))}
                          style={{ width: 60, border: 'none', borderBottom: '1px solid #EDE5DC', padding: '4px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', textAlign: 'center', fontFamily: 'inherit' }} />
                        <span style={{ fontSize: 11, color: '#9E8880' }}>회</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 색상 */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 6 }}>색상</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '2px solid #2C1810' : '2px solid transparent' }} />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setShowAddModal(false)} style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
              <button onClick={handleAddEvent} disabled={loading}
                style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: loading ? '#9E8880' : '#2C1810', color: '#FDF8F4', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '저장 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일정 상세 모달 */}
      {showDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 380 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE5DC' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>일정 상세</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {canEdit(showDetail) ? (
                <>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', marginBottom: 10, fontFamily: 'inherit' }} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                      style={{ flex: 1, border: 'none', borderBottom: '1px solid #EDE5DC', padding: '4px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
                    <span style={{ color: '#9E8880' }}>~</span>
                    <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                      style={{ flex: 1, border: 'none', borderBottom: '1px solid #EDE5DC', padding: '4px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#9E8880' }}>작성자: {showDetail.authorName || showDetail.authorId}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#2C1810', marginBottom: 6 }}>{showDetail.title}</div>
                  <div style={{ fontSize: 11, color: '#9E8880', marginBottom: 4 }}>{showDetail.startDate} ~ {showDetail.endDate}</div>
                  <div style={{ fontSize: 11, color: '#9E8880' }}>작성자: {showDetail.authorName || showDetail.authorId}</div>
                </>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <button onClick={() => setShowDetail(null)} style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>닫기</button>
              {canEdit(showDetail) && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {showDetail.repeatGroupId && (
                    <button onClick={() => handleDeleteRepeat(showDetail)}
                      style={{ fontSize: 10, padding: '6px 12px', border: '1px solid #C17B6B', color: '#C17B6B', background: '#fff', cursor: 'pointer', letterSpacing: '0.06em' }}>
                      이후 모두 삭제
                    </button>
                  )}
                  <button onClick={() => handleDeleteSingle(showDetail)}
                    style={{ fontSize: 10, padding: '6px 12px', border: '1px solid #EDE5DC', color: '#9E8880', background: '#fff', cursor: 'pointer', letterSpacing: '0.06em' }}>
                    이 일정만 삭제
                  </button>
                  <button onClick={handleUpdateEvent} disabled={loading}
                    style={{ fontSize: 10, padding: '6px 16px', background: '#2C1810', color: '#FDF8F4', border: 'none', cursor: 'pointer', letterSpacing: '0.08em' }}>
                    저장
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
