'use client';

import { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, EventContentArg } from '@fullcalendar/core';
import {
  HOLIDAYS_2026, DAY_NAMES,
  toDS, addDays, isPersonal, isLeave, isRequest,
} from '@/lib/calendar-helpers';

interface CalendarGridProps {
  events?: EventInput[];
  initialYear?: number;
  initialMonth?: number;
  onDateClick?: (dateStr: string) => void;
  onDateRangeSelect?: (startStr: string, endStr: string) => void;
}

export default function CalendarGrid({ events = [], initialYear, initialMonth, onDateClick, onDateRangeSelect }: CalendarGridProps) {
  const leftRef = useRef<FullCalendar>(null);
  const rightRef = useRef<FullCalendar>(null);

  const now = new Date();
  const [cur, setCur] = useState({
    year: initialYear ?? now.getFullYear(),
    month: initialMonth ?? now.getMonth(),
  });
  const [editYear, setEditYear] = useState(false);
  const [editMonth, setEditMonth] = useState(false);
  const [navYear, setNavYear] = useState(cur.year.toString());
  const [navMonth, setNavMonth] = useState(String(cur.month + 1).padStart(2, '0'));
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const nextMonth = (y: number, m: number) => {
    let ny = y, nm = m + 1;
    if (nm > 11) { nm = 0; ny++; }
    return { year: ny, month: nm };
  };

  const syncCalendars = (y: number, m: number) => {
    const left = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const n = nextMonth(y, m);
    const right = `${n.year}-${String(n.month + 1).padStart(2, '0')}-01`;
    leftRef.current?.getApi().gotoDate(left);
    rightRef.current?.getApi().gotoDate(right);
  };

  const moveMonth = (diff: number) => {
    setCur(c => {
      let m = c.month + diff, y = c.year;
      while (m < 0) { m += 12; y--; }
      while (m > 11) { m -= 12; y++; }
      setNavYear(y.toString());
      setNavMonth(String(m + 1).padStart(2, '0'));
      setTimeout(() => syncCalendars(y, m), 0);
      return { year: y, month: m };
    });
  };

  const applyYearInput = () => {
    const y = parseInt(navYear, 10);
    if (!isNaN(y) && y > 1900 && y < 2100) {
      setCur(c => {
        setTimeout(() => syncCalendars(y, c.month), 0);
        return { ...c, year: y };
      });
    } else {
      setNavYear(cur.year.toString());
    }
    setEditYear(false);
  };

  const applyMonthInput = () => {
    const m = parseInt(navMonth, 10);
    if (!isNaN(m) && m >= 1 && m <= 12) {
      setCur(c => {
        setTimeout(() => syncCalendars(c.year, m - 1), 0);
        return { ...c, month: m - 1 };
      });
    } else {
      setNavMonth(String(cur.month + 1).padStart(2, '0'));
    }
    setEditMonth(false);
  };

  const todayStr = toDS(new Date());
  const n = nextMonth(cur.year, cur.month);

  // ─── 커스텀 렌더 ───────────────────────────────────────

  const renderDayHeaderContent = (arg: { text: string; dow: number }) => {
    const color = arg.dow === 0 ? '#C17B6B' : arg.dow === 6 ? '#6B8BC1' : '#9E8880';
    return (
      <span style={{ fontSize: 10, fontWeight: 600, color }}>
        {DAY_NAMES[arg.dow]}
      </span>
    );
  };

  const renderDayCellContent = (arg: { date: Date; dayNumberText: string; isPast: boolean; isToday: boolean }) => {
    const ds = toDS(arg.date);
    const dow = arg.date.getDay();
    const isHol = !!HOLIDAYS_2026[ds];
    const dateColor = arg.isToday ? '#C17B6B' : isHol || dow === 0 ? '#C17B6B' : dow === 6 ? '#6B8BC1' : '#2C1810';

    return (
      <div style={{ textAlign: 'right', padding: '2px 4px 0 0' }}>
        <span style={{
          fontSize: 11,
          fontWeight: arg.isToday ? 700 : 400,
          color: dateColor,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 20,
          height: 20,
          borderRadius: arg.isToday ? '50%' : 0,
          background: arg.isToday ? '#F5E6E0' : 'transparent',
        }}>
          {arg.date.getDate()}
        </span>
        {isHol && (
          <div style={{ fontSize: 9, color: '#C17B6B', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {HOLIDAYS_2026[ds]}
          </div>
        )}
      </div>
    );
  };

  const renderEventContent = (arg: EventContentArg) => {
    const col = arg.event.backgroundColor || '#3B6D11';
    const personal = isPersonal(col);
    const leave = isLeave(col);
    const request = isRequest(col);

    const bgColor = personal
      ? col === '#639922' ? 'rgba(99,153,34,0.15)'
        : col === '#378ADD' ? 'rgba(55,138,221,0.15)'
        : 'rgba(186,117,23,0.15)'
      : leave ? 'rgba(83,74,183,0.15)'
      : col;
    const textColor = personal
      ? col === '#639922' ? '#3B6D11'
        : col === '#378ADD' ? '#185FA5'
        : '#854F0B'
      : leave ? '#3C3489'
      : '#fff';
    const borderLeft = personal
      ? `2px solid ${col}`
      : leave ? '2px solid #534AB7'
      : request ? '3px solid #72243E'
      : 'none';

    return (
      <div style={{
        fontSize: 10,
        color: textColor,
        background: bgColor,
        padding: '1px 4px',
        borderRadius: 3,
        borderLeft,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        width: '100%',
      }}>
        {arg.event.title}
      </div>
    );
  };

  const commonProps = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth' as const,
    locale: 'ko',
    headerToolbar: false as const,
    height: 'auto' as const,
    fixedWeekCount: false,
    showNonCurrentDates: true,
    selectable: true,
    unselectAuto: true,
    longPressDelay: 100,
    eventOrder: '-duration,start,title',
    eventOrderStrict: true,
    dayMaxEvents: 3,
    events,
    dateClick: onDateClick ? (arg: { date: Date }) => onDateClick(toDS(arg.date)) : undefined,
    select: onDateRangeSelect ? (arg: { start: Date; end: Date }) => onDateRangeSelect(toDS(arg.start), toDS(addDays(arg.end, -1))) : undefined,
    dayHeaderContent: renderDayHeaderContent,
    dayCellContent: renderDayCellContent,
    eventContent: renderEventContent,
  };

  // ─── 색상 범례 ────────────────────────────────────────

  const legends: { color: string; label: string; style: 'solid' | 'border' }[] = [
    { color: '#3B6D11', label: '업무·전체', style: 'solid' },
    { color: '#185FA5', label: '업무·나만', style: 'solid' },
    { color: '#854F0B', label: '업무·지정', style: 'solid' },
    { color: '#993556', label: '업무요청', style: 'solid' },
    { color: '#639922', label: '개인·전체', style: 'border' },
    { color: '#378ADD', label: '개인·나만', style: 'border' },
    { color: '#BA7517', label: '개인·지정', style: 'border' },
    { color: '#534AB7', label: '연차', style: 'border' },
  ];

  return (
    <div>
      {/* 커스텀 toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12,
        padding: '12px 0', background: '#fff', borderBottom: '1px solid #EDE5DC',
      }}>
        <button onClick={() => moveMonth(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#9E8880' }}>‹</button>

        {editYear ? (
          <input value={navYear} onChange={e => setNavYear(e.target.value)}
            onBlur={applyYearInput} onKeyDown={e => e.key === 'Enter' && applyYearInput()}
            autoFocus style={{ width: 48, textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#2C1810', border: 'none', borderBottom: '2px solid #C17B6B', outline: 'none', background: 'transparent' }}
          />
        ) : (
          <span onClick={() => setEditYear(true)} style={{ fontSize: 16, fontWeight: 700, color: '#2C1810', cursor: 'pointer' }}>
            {cur.year}년
          </span>
        )}

        {editMonth ? (
          <input value={navMonth} onChange={e => setNavMonth(e.target.value)}
            onBlur={applyMonthInput} onKeyDown={e => e.key === 'Enter' && applyMonthInput()}
            autoFocus style={{ width: 28, textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#2C1810', border: 'none', borderBottom: '2px solid #C17B6B', outline: 'none', background: 'transparent' }}
          />
        ) : (
          <span onClick={() => setEditMonth(true)} style={{ fontSize: 16, fontWeight: 700, color: '#2C1810', cursor: 'pointer' }}>
            {String(cur.month + 1).padStart(2, '0')}월
          </span>
        )}

        <button onClick={() => moveMonth(1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#9E8880' }}>›</button>
      </div>

      {/* 2개월 병렬 (모바일: 1개월) */}
      <div style={{ display: 'flex', gap: 16, padding: '8px 0' }}>
        <div style={{ flex: 1, minWidth: 0, border: '1px solid #EDE5DC', background: '#fff' }}>
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#2C1810', padding: '8px 0' }}>
            {cur.year}년 {cur.month + 1}월
          </div>
          <FullCalendar
            ref={leftRef}
            {...commonProps}
            initialDate={`${cur.year}-${String(cur.month + 1).padStart(2, '0')}-01`}
          />
        </div>

        {!isMobile && (
          <div style={{ flex: 1, minWidth: 0, border: '1px solid #EDE5DC', background: '#fff' }}>
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#2C1810', padding: '8px 0' }}>
              {n.year}년 {n.month + 1}월
            </div>
            <FullCalendar
              ref={rightRef}
              {...commonProps}
              initialDate={`${n.year}-${String(n.month + 1).padStart(2, '0')}-01`}
            />
          </div>
        )}
      </div>

      {/* 색상 범례 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, padding: '12px 0' }}>
        {legends.map(lg => (
          <div key={lg.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 12, height: 12, borderRadius: 2,
              background: lg.style === 'solid' ? lg.color : `${lg.color}26`,
              border: lg.style === 'border' ? `2px solid ${lg.color}` : 'none',
            }} />
            <span style={{ fontSize: 10, color: '#9E8880' }}>{lg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
