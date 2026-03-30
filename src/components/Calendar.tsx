import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';

// 2026년 한국 공휴일 데이터
const HOLIDAYS_2026 = [
  { date: '2026-01-01', name: '신정' },
  { date: '2026-01-28', name: '설날연휴' },
  { date: '2026-01-29', name: '설날연휴' },
  { date: '2026-01-30', name: '설날연휴' },
  { date: '2026-03-01', name: '삼일절' },
  { date: '2026-05-05', name: '어린이날' },
  { date: '2026-05-15', name: '부처님오신날' },
  { date: '2026-06-06', name: '현충일' },
  { date: '2026-08-15', name: '광복절' },
  { date: '2026-09-24', name: '추석연휴' },
  { date: '2026-09-25', name: '추석연휴' },
  { date: '2026-09-26', name: '추석연휴' },
  { date: '2026-10-03', name: '개천절' },
  { date: '2026-10-09', name: '한글날' },
  { date: '2026-12-25', name: '크리스마스' },
];


export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  authorId: string;
  color: string;
  createdAt: any;
  authorName?: string;
}

function getMonthMatrix(year: number, month: number) {
  // month: 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const matrix = [];
  let week = [];
  let day = 1 - firstDay.getDay();
  while (day <= lastDay.getDate()) {
    week = [];
    for (let i = 0; i < 7; i++, day++) {
      if (day < 1 || day > lastDay.getDate()) {
        week.push(null);
      } else {
        week.push(new Date(year, month, day));
      }
    }
    matrix.push(week);
  }
  return matrix;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getHoliday(date: Date) {
  return HOLIDAYS_2026.find(h => h.date === toDateString(date));
}

const COLORS = [
  '#81D8D0', '#F4C0D1', '#B5D4F4', '#C0DD97', '#FAC775', '#F0997B', '#AFA9EC', '#D3D1C7',
];

export default function Calendar() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const today = new Date();
  // current: 왼쪽 달력(기준), 오른쪽은 +1달
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetail, setShowDetail] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', color: COLORS[0] });
  const [loading, setLoading] = useState(false);
  // 드래그 상태
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 일정 실시간 구독
  useEffect(() => {
    const q = query(collection(db, 'calendarEvents'), orderBy('startDate'));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CalendarEvent))
      );
    });
    return unsub;
  }, []);

  // 월 이동 (두 달력 동시 이동)
  const moveMonth = (diff: number) => {
    setCurrent((cur) => {
      let m = cur.month + diff;
      let y = cur.year;
      while (m < 0) { m += 12; y--; }
      while (m > 11) { m -= 12; y++; }
      return { year: y, month: m };
    });
  };

  // 날짜 직접 입력 (왼쪽 달력 기준)
  const handleInputMonth = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d{4}-\d{2}$/.test(val)) {
      const [y, m] = val.split('-').map(Number);
      setCurrent({ year: y, month: m - 1 });
    }
  };

  // 일정 추가
  const handleAddEvent = async () => {
    if (!form.title.trim() || !form.startDate || !form.endDate) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'calendarEvents'), {
        title: form.title,
        startDate: form.startDate,
        endDate: form.endDate,
        authorId: user?.uid,
        authorName: user?.displayName || user?.email,
        color: form.color,
        createdAt: new Date(),
      });
      setShowAddModal(false);
      setForm({ title: '', startDate: '', endDate: '', color: COLORS[0] });
      addToast('일정이 추가되었습니다.');
    } catch (e) {
      addToast('일정 추가 실패');
    }
    setLoading(false);
  };

  // 일정 수정
  const handleUpdateEvent = async (event: CalendarEvent) => {
    if (!form.title.trim() || !form.startDate || !form.endDate) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'calendarEvents', event.id), {
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

  // 일정 삭제
  const handleDeleteEvent = async (event: CalendarEvent) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'calendarEvents', event.id));
      setShowDetail(null);
      addToast('일정이 삭제되었습니다.');
    } catch (e) {
      addToast('일정 삭제 실패');
    }
    setLoading(false);
  };

  // 날짜 클릭/드래그 시 일정 추가 모달
  const onDateClick = (date: Date) => {
    setSelectedDate(date);
    setForm({
      title: '',
      startDate: toDateString(date),
      endDate: toDateString(date),
      color: COLORS[0],
    });
    setShowAddModal(true);
  };

  // 드래그 시작
  const handleDragStart = (date: Date) => {
    setDragStart(date);
    setDragEnd(date);
    setIsDragging(true);
  };
  // 드래그 중
  const handleDragEnter = (date: Date) => {
    if (isDragging) setDragEnd(date);
  };
  // 드래그 끝
  const handleDragEnd = () => {
    if (dragStart && dragEnd) {
      const start = dragStart < dragEnd ? dragStart : dragEnd;
      const end = dragStart > dragEnd ? dragStart : dragEnd;
      setForm({
        title: '',
        startDate: toDateString(start),
        endDate: toDateString(end),
        color: COLORS[0],
      });
      setShowAddModal(true);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // 일정 클릭 시 상세
  const onEventClick = (event: CalendarEvent) => {
    setShowDetail(event);
    setForm({
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      color: event.color,
    });
  };

  // 두 달력 행렬
  const leftMatrix = getMonthMatrix(current.year, current.month);
  // 오른쪽 달력: 다음 달(연도/월 보정)
  let nextYear = current.year, nextMonth = current.month + 1;
  if (nextMonth > 11) { nextMonth = 0; nextYear++; }
  const rightMatrix = getMonthMatrix(nextYear, nextMonth);
  const leftMonthStr = `${current.year}-${String(current.month + 1).padStart(2, '0')}`;
  const rightMonthStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}`;

  // 날짜별 일정 필터 (기간 포함)
  function getEventsForDay(date: Date) {
    return events.filter(ev => (
      ev.startDate <= toDateString(date) && ev.endDate >= toDateString(date)
    ));
  }

  // 일정 더보기 팝업 상태
  const [moreEvents, setMoreEvents] = useState<{date: Date, events: CalendarEvent[]} | null>(null);

  // 권한 체크
  function canEdit(event: CalendarEvent) {
    return user && (user.role === 'admin' || user.uid === event.authorId);
  }

  return (
    <div className="bg-white border-2 border-[#81D8D0] rounded-lg p-4 w-full mx-auto">
      {/* 상단: 월 이동, 입력 */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => moveMonth(-1)} className="px-2 py-1 text-lg">‹</button>
        <input
          type="month"
          value={leftMonthStr}
          onChange={handleInputMonth}
          className="border rounded px-2 py-1 w-32 text-center"
        />
        <button onClick={() => moveMonth(1)} className="px-2 py-1 text-lg">›</button>
      </div>
      {/* 두 달력 가로 배치 */}
      <div className="flex w-full gap-4">
        {/* 왼쪽: 현재 월 */}
        <div className="flex-1">
          <div className="text-center font-bold mb-2 text-lg">{leftMonthStr}</div>
          <div className="grid grid-cols-7 text-center font-bold mb-2 text-base">
            {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
              <div key={d} className={i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""}>{d}</div>
            ))}
          </div>
          <div
            className="grid grid-cols-7 gap-2 select-none"
            onMouseUp={isDragging ? handleDragEnd : undefined}
            onTouchEnd={isDragging ? handleDragEnd : undefined}
          >
            {leftMatrix.flat().map((date, idx) => {
              if (!date) return <div key={idx} className="min-h-[90px]" />;
              const isCurrentMonth = date.getMonth() === current.month;
              const isToday = isSameDay(date, today);
              const holiday = getHoliday(date);
              const dayEvents = getEventsForDay(date);
              // 드래그 하이라이트
              let isHighlighted = false;
              if (isDragging && dragStart && dragEnd) {
                const start = dragStart < dragEnd ? dragStart : dragEnd;
                const end = dragStart > dragEnd ? dragStart : dragEnd;
                isHighlighted = date >= start && date <= end;
              }
              // 일정 최대 3개, 초과 시 +N개 더보기
              const maxShow = 3;
              const showEvents = dayEvents.slice(0, maxShow);
              const moreCount = dayEvents.length - maxShow;
              return (
                <div
                  key={idx}
                  className={`relative min-h-[90px] border rounded p-2 flex flex-col items-start overflow-hidden transition-all
                    ${isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-300"}
                    ${isToday ? "border-[#81D8D0] ring-2 ring-[#81D8D0]" : ""}
                    ${isHighlighted ? "bg-[#e0f7f5] border-[#81D8D0]" : ""}
                    cursor-pointer
                  `}
                  onMouseDown={e => { if (isCurrentMonth && e.button === 0) handleDragStart(date); }}
                  onMouseEnter={e => { if (isDragging && isCurrentMonth && e.buttons === 1) handleDragEnter(date); }}
                  onTouchStart={e => { if (isCurrentMonth) handleDragStart(date); }}
                  onTouchMove={e => {
                    if (isDragging && isCurrentMonth && e.touches.length === 1) {
                      const target = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
                      if (target && target instanceof HTMLElement && target.dataset.date) {
                        handleDragEnter(new Date(target.dataset.date));
                      }
                    }
                  }}
                  onMouseUp={e => { if (isDragging) handleDragEnd(); }}
                  onTouchEnd={e => { if (isDragging) handleDragEnd(); }}
                  onClick={e => {
                    if (!isDragging && isCurrentMonth) onDateClick(date);
                  }}
                  data-date={toDateString(date)}
                >
                  <div className={`text-base font-bold mb-2 ${holiday || date.getDay() === 0 ? "text-red-500" : ""}`}>{date.getDate()}</div>
                  {holiday && <div className="text-xs text-red-400 font-semibold mb-1">{holiday.name}</div>}
                  <div className="flex flex-col gap-1 w-full">
                    {showEvents.map(ev => {
                      const isStart = ev.startDate === toDateString(date);
                      return (
                        <div
                          key={ev.id}
                          className={`w-full h-6 rounded text-[13px] px-2 truncate cursor-pointer border ${isStart ? "border-l-4" : "border-l-2"}`}
                          style={{ background: ev.color, opacity: isCurrentMonth ? 1 : 0.5, borderColor: ev.color, marginBottom: 2 }}
                          onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                        >
                          {isStart && <span className="font-bold">{ev.title}</span>}
                        </div>
                      );
                    })}
                    {moreCount > 0 && (
                      <button
                        className="text-xs text-gray-500 underline mt-1"
                        onClick={e => { e.stopPropagation(); setMoreEvents({ date, events: dayEvents }); }}
                      >
                        +{moreCount}개 더보기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* 오른쪽: 다음 월 */}
        <div className="flex-1">
          <div className="text-center font-bold mb-2 text-lg">{rightMonthStr}</div>
          <div className="grid grid-cols-7 text-center font-bold mb-2 text-base">
            {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
              <div key={d} className={i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""}>{d}</div>
            ))}
          </div>
          <div
            className="grid grid-cols-7 gap-2 select-none"
            onMouseUp={isDragging ? handleDragEnd : undefined}
            onTouchEnd={isDragging ? handleDragEnd : undefined}
          >
            {rightMatrix.flat().map((date, idx) => {
              if (!date) return <div key={idx} className="min-h-[90px]" />;
              const isCurrentMonth = date.getMonth() === nextMonth && date.getFullYear() === nextYear;
              const isToday = isSameDay(date, today);
              const holiday = getHoliday(date);
              const dayEvents = getEventsForDay(date);
              // 드래그 하이라이트
              let isHighlighted = false;
              if (isDragging && dragStart && dragEnd) {
                const start = dragStart < dragEnd ? dragStart : dragEnd;
                const end = dragStart > dragEnd ? dragStart : dragEnd;
                isHighlighted = date >= start && date <= end;
              }
              // 일정 최대 3개, 초과 시 +N개 더보기
              const maxShow = 3;
              const showEvents = dayEvents.slice(0, maxShow);
              const moreCount = dayEvents.length - maxShow;
              return (
                <div
                  key={idx}
                  className={`relative min-h-[90px] border rounded p-2 flex flex-col items-start overflow-hidden transition-all
                    ${isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-300"}
                    ${isToday ? "border-[#81D8D0] ring-2 ring-[#81D8D0]" : ""}
                    ${isHighlighted ? "bg-[#e0f7f5] border-[#81D8D0]" : ""}
                    cursor-pointer
                  `}
                  onMouseDown={e => { if (isCurrentMonth && e.button === 0) handleDragStart(date); }}
                  onMouseEnter={e => { if (isDragging && isCurrentMonth && e.buttons === 1) handleDragEnter(date); }}
                  onTouchStart={e => { if (isCurrentMonth) handleDragStart(date); }}
                  onTouchMove={e => {
                    if (isDragging && isCurrentMonth && e.touches.length === 1) {
                      const target = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
                      if (target && target instanceof HTMLElement && target.dataset.date) {
                        handleDragEnter(new Date(target.dataset.date));
                      }
                    }
                  }}
                  onMouseUp={e => { if (isDragging) handleDragEnd(); }}
                  onTouchEnd={e => { if (isDragging) handleDragEnd(); }}
                  onClick={e => {
                    if (!isDragging && isCurrentMonth) onDateClick(date);
                  }}
                  data-date={toDateString(date)}
                >
                  <div className={`text-base font-bold mb-2 ${holiday || date.getDay() === 0 ? "text-red-500" : ""}`}>{date.getDate()}</div>
                  {holiday && <div className="text-xs text-red-400 font-semibold mb-1">{holiday.name}</div>}
                  <div className="flex flex-col gap-1 w-full">
                    {showEvents.map(ev => {
                      const isStart = ev.startDate === toDateString(date);
                      return (
                        <div
                          key={ev.id}
                          className={`w-full h-6 rounded text-[13px] px-2 truncate cursor-pointer border ${isStart ? "border-l-4" : "border-l-2"}`}
                          style={{ background: ev.color, opacity: isCurrentMonth ? 1 : 0.5, borderColor: ev.color, marginBottom: 2 }}
                          onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                        >
                          {isStart && <span className="font-bold">{ev.title}</span>}
                        </div>
                      );
                    })}
                    {moreCount > 0 && (
                      <button
                        className="text-xs text-gray-500 underline mt-1"
                        onClick={e => { e.stopPropagation(); setMoreEvents({ date, events: dayEvents }); }}
                      >
                        +{moreCount}개 더보기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 일정 더보기 팝업 */}
      {moreEvents && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" onClick={() => setMoreEvents(null)}>
          <div className="bg-white p-6 rounded-lg w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">{toDateString(moreEvents.date)} 일정 전체</h3>
            <div className="flex flex-col gap-2">
              {moreEvents.events.map(ev => (
                <div
                  key={ev.id}
                  className="w-full rounded text-[13px] px-2 py-1 cursor-pointer border border-l-4"
                  style={{ background: ev.color, borderColor: ev.color }}
                  onClick={() => { setMoreEvents(null); onEventClick(ev); }}
                >
                  <span className="font-bold">{ev.title}</span>
                  <span className="ml-2 text-xs">{ev.startDate}{ev.endDate !== ev.startDate ? `~${ev.endDate}` : ''}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50" onClick={() => setMoreEvents(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 일정 추가 모달 - 디자인 개선 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-center">일정 추가</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">제목</label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base mb-2"
                placeholder="제목을 입력하세요"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">날짜 범위</label>
              <div className="flex gap-3 items-center">
                <input
                  type="date"
                  className="border rounded-lg px-3 py-2 w-full text-base"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                />
                <span className="text-gray-500">~</span>
                <input
                  type="date"
                  className="border rounded-lg px-3 py-2 w-full text-base"
                  value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-1">색상</label>
              <div className="flex gap-4 flex-wrap mt-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${form.color === c ? "border-[#222] scale-110" : "border-gray-200"}`}
                    style={{ background: c }}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-base"
                disabled={loading}
              >취소</button>
              <button
                onClick={handleAddEvent}
                className="px-6 py-2 bg-[#81D8D0] text-white rounded-lg hover:bg-[#6BC4BB] text-base font-semibold"
                disabled={loading}
              >추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 일정 상세/수정/삭제 모달 */}
      {showDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-xs">
            <h3 className="text-lg font-semibold mb-2">일정 상세</h3>
            <div className="mb-2">
              <div className="font-bold text-base mb-1">{showDetail.title}</div>
              <div className="text-xs mb-1">기간: {showDetail.startDate} ~ {showDetail.endDate}</div>
              <div className="text-xs mb-1">작성자: {showDetail.authorName || showDetail.authorId}</div>
            </div>
            {canEdit(showDetail) ? (
              <>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                  placeholder="제목"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
                <div className="flex gap-2 mb-2">
                  <input
                    type="date"
                    className="border rounded px-2 py-1 w-full"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  />
                  <span className="self-center">~</span>
                  <input
                    type="date"
                    className="border rounded px-2 py-1 w-full"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 mb-4">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      className={`w-6 h-6 rounded-full border-2 ${form.color === c ? "border-[#222]" : "border-gray-200"}`}
                      style={{ background: c }}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      type="button"
                    />
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowDetail(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    disabled={loading}
                  >닫기</button>
                  <button
                    onClick={() => handleUpdateEvent(showDetail)}
                    className="px-4 py-2 bg-[#81D8D0] text-white rounded hover:bg-[#6BC4BB]"
                    disabled={loading}
                  >수정</button>
                  <button
                    onClick={() => handleDeleteEvent(showDetail)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    disabled={loading}
                  >삭제</button>
                </div>
              </>
            ) : (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetail(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >닫기</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
