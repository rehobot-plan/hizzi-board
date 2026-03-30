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

  // 월 이동
  const moveMonth = (diff: number) => {
    setCurrent((cur) => {
      let m = cur.month + diff;
      let y = cur.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  };

  // 날짜 직접 입력
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

  // 날짜 클릭 시 일정 추가 모달
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

  // 달력 행렬
  const matrix = getMonthMatrix(current.year, current.month);
  const monthStr = `${current.year}-${String(current.month + 1).padStart(2, '0')}`;

  // 날짜별 일정 필터
  function getEventsForDay(date: Date) {
    return events.filter(ev => {
      return (
        ev.startDate <= toDateString(date) && ev.endDate >= toDateString(date)
      );
    });
  }

  // 권한 체크
  function canEdit(event: CalendarEvent) {
    return user && (user.role === 'admin' || user.uid === event.authorId);
  }

  return (
    <div className="bg-white border-2 border-[#81D8D0] rounded-lg p-4 w-full max-w-2xl mx-auto">
      {/* 상단: 월 이동, 입력 */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => moveMonth(-1)} className="px-2 py-1 text-lg">◀</button>
        <input
          type="month"
          value={monthStr}
          onChange={handleInputMonth}
          className="border rounded px-2 py-1 w-32 text-center"
        />
        <button onClick={() => moveMonth(1)} className="px-2 py-1 text-lg">▶</button>
      </div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 text-center font-bold mb-1">
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div key={d} className={i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""}>{d}</div>
        ))}
      </div>
      {/* 날짜 셀 */}
      <div className="grid grid-cols-7 gap-1">
        {matrix.flat().map((date, idx) => {
          if (!date) return <div key={idx} className="h-16" />;
          const isCurrentMonth = date.getMonth() === current.month;
          const isToday = isSameDay(date, today);
          const holiday = getHoliday(date);
          const dayEvents = getEventsForDay(date);
          return (
            <div
              key={idx}
              className={`relative h-16 border rounded p-1 cursor-pointer flex flex-col items-start overflow-hidden transition-all
                ${isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-300"}
                ${isToday ? "border-[#81D8D0] ring-2 ring-[#81D8D0]" : ""}
              `}
              onClick={() => isCurrentMonth && onDateClick(date)}
            >
              <div className={`text-xs font-bold mb-1 ${holiday || date.getDay() === 0 ? "text-red-500" : ""}`}>{date.getDate()}</div>
              {/* 공휴일명 */}
              {holiday && <div className="text-[10px] text-red-400 font-semibold">{holiday.name}</div>}
              {/* 일정 블록 */}
              <div className="flex flex-col gap-[2px] w-full">
                {dayEvents.map(ev => {
                  // 시작일~종료일: 가로 블록, 단일일정도 지원
                  const isStart = ev.startDate === toDateString(date);
                  const isEnd = ev.endDate === toDateString(date);
                  return (
                    <div
                      key={ev.id}
                      className={`w-full h-4 rounded text-[10px] px-1 truncate cursor-pointer border ${isStart ? "border-l-4" : "border-l-2"}`}
                      style={{ background: ev.color, opacity: isCurrentMonth ? 1 : 0.5, borderColor: ev.color }}
                      onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                    >
                      {isStart && <span className="font-bold">{ev.title}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 일정 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-xs">
            <h3 className="text-lg font-semibold mb-4">일정 추가</h3>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
              placeholder="제목"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
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
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                disabled={loading}
              >취소</button>
              <button
                onClick={handleAddEvent}
                className="px-4 py-2 bg-[#81D8D0] text-white rounded hover:bg-[#6BC4BB]"
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
