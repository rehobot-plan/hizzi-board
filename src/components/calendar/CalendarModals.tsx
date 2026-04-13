'use client';

import { LeaveType } from '@/store/leaveStore';
import { CalendarFormState } from './calendar-types';
import {
  DAY_KEYS, KOREAN_DAYS,
  getEventColor, isPersonal, isLeave,
} from '@/lib/calendar-helpers';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AddEventModalProps {
  open: boolean;
  form: CalendarFormState;
  setForm: React.Dispatch<React.SetStateAction<CalendarFormState>>;
  addMode: 'calendar' | 'leave';
  setAddMode: (m: 'calendar' | 'leave') => void;
  selectedStartDate: string;
  selectedEndDate: string;
  leaveTargetUserId: string;
  setLeaveTargetUserId: (v: string) => void;
  canSelectLeaveTarget: boolean;
  users: UserInfo[];
  currentAppUser: UserInfo | undefined;
  currentUserDisplay: string;
  leaveType: LeaveType;
  setLeaveType: (v: LeaveType) => void;
  leaveMemo: string;
  setLeaveMemo: (v: string) => void;
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  setRepeatType: (v: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
  weeklyDay: string;
  setWeeklyDay: (v: string) => void;
  excludeHolidays: boolean;
  setExcludeHolidays: (v: boolean | ((prev: boolean) => boolean)) => void;
  endType: 'forever' | 'date' | 'count';
  setEndType: (v: 'forever' | 'date' | 'count') => void;
  endDate: string;
  setEndDate: (v: string) => void;
  endCount: number;
  setEndCount: (v: number) => void;
  loading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function AddEventModal(props: AddEventModalProps) {
  const {
    open, form, setForm, addMode, setAddMode,
    selectedStartDate, selectedEndDate,
    leaveTargetUserId, setLeaveTargetUserId, canSelectLeaveTarget,
    users, currentAppUser, currentUserDisplay,
    leaveType, setLeaveType, leaveMemo, setLeaveMemo,
    repeatType, setRepeatType, weeklyDay, setWeeklyDay,
    excludeHolidays, setExcludeHolidays,
    endType, setEndType, endDate, setEndDate, endCount, setEndCount,
    loading, onCancel, onSubmit,
  } = props;

  if (!open) return null;

  const syncRangeToForm = (s: string, e: string) => {
    setForm(f => ({ ...f, startDate: s, endDate: e }));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,20,16,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#fff', border: '1px solid #EDE5DC', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* 헤더 */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #EDE5DC', position: 'sticky', top: 0, background: '#fff' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810' }}>일정 추가</span>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* 모드 토글 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            <button onClick={() => { setAddMode('calendar'); syncRangeToForm(selectedStartDate || form.startDate, selectedEndDate || form.endDate || form.startDate); }}
              style={{ padding: '5px 10px', border: '1px solid ' + (addMode === 'calendar' ? '#2C1810' : '#EDE5DC'), background: addMode === 'calendar' ? '#FDF8F4' : '#fff', color: addMode === 'calendar' ? '#2C1810' : '#9E8880', fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>
              일반 일정
            </button>
            <button onClick={() => { setAddMode('leave'); syncRangeToForm(selectedStartDate || form.startDate, selectedEndDate || form.endDate || form.startDate); }}
              style={{ padding: '5px 10px', border: '1px solid ' + (addMode === 'leave' ? '#2C1810' : '#EDE5DC'), background: addMode === 'leave' ? '#FDF8F4' : '#fff', color: addMode === 'leave' ? '#2C1810' : '#9E8880', fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>
              연차 등록
            </button>
          </div>

          {addMode === 'calendar' ? (
            <>
              {/* 제목 */}
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="일정 제목"
                style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', marginBottom: 16, fontFamily: 'inherit' }} />

              {/* 날짜 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>날짜</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="date" value={form.startDate} onChange={e => { setForm(f => ({ ...f, startDate: e.target.value })); const d = new Date(e.target.value + 'T00:00:00'); setWeeklyDay(DAY_KEYS[d.getDay()]); }}
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
                  <span style={{ color: '#9E8880' }}>~</span>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #EDE5DC', padding: '6px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
                </div>
              </div>

              {/* 반복 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>반복</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['none', 'daily', 'weekly', 'monthly', 'yearly'] as const).map(t => {
                    const labels: Record<string, string> = { none: '안함', daily: '매일', weekly: '매주', monthly: '매월', yearly: '매년' };
                    return (
                      <button key={t} onClick={() => { setRepeatType(t); if (t === 'weekly' && form.startDate) { const d = new Date(form.startDate + 'T00:00:00'); setWeeklyDay(DAY_KEYS[d.getDay()]); } }}
                        style={{ padding: '5px 10px', border: '1px solid ' + (repeatType === t ? '#C17B6B' : '#EDE5DC'), background: repeatType === t ? '#FFF5F2' : '#fff', color: repeatType === t ? '#C17B6B' : '#9E8880', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                        {labels[t]}
                      </button>
                    );
                  })}
                </div>

                {repeatType === 'weekly' && weeklyDay && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#9E8880' }}>매주 {KOREAN_DAYS[DAY_KEYS.indexOf(weeklyDay)]} 반복</div>
                )}

                {repeatType !== 'none' && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: '#9E8880' }}>공휴일 제외</span>
                      <div onClick={() => setExcludeHolidays((v: boolean) => !v)}
                        style={{ width: 32, height: 18, background: excludeHolidays ? '#C17B6B' : '#EDE5DC', borderRadius: 9, position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: 2, left: excludeHolidays ? 14 : 2, width: 14, height: 14, background: '#fff', borderRadius: '50%', transition: 'left .2s' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#9E8880', marginBottom: 6 }}>종료</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      {(['forever', 'date', 'count'] as const).map(t => {
                        const labels: Record<string, string> = { forever: '무기한', date: '날짜 지정', count: '횟수 지정' };
                        return (
                          <button key={t} onClick={() => setEndType(t)}
                            style={{ padding: '4px 8px', border: '1px solid ' + (endType === t ? '#2C1810' : '#EDE5DC'), background: endType === t ? '#FDF8F4' : '#fff', color: endType === t ? '#2C1810' : '#9E8880', fontSize: 10, cursor: 'pointer' }}>
                            {labels[t]}
                          </button>
                        );
                      })}
                    </div>
                    {endType === 'date' && (
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                        style={{ border: 'none', borderBottom: '1px solid #EDE5DC', padding: '4px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
                    )}
                    {endType === 'count' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="number" value={endCount} min={1} max={200} onChange={e => setEndCount(Math.max(1, parseInt(e.target.value) || 1))}
                          style={{ width: 60, border: 'none', borderBottom: '1px solid #EDE5DC', padding: '4px 0', fontSize: 12, color: '#2C1810', outline: 'none', background: 'transparent', textAlign: 'center', fontFamily: 'inherit' }} />
                        <span style={{ fontSize: 11, color: '#9E8880' }}>회</span>
                      </div>
                    )}
                    {endType === 'forever' && (
                      <div style={{ fontSize: 11, color: '#C4B8B0' }}>1년치 일정이 생성됩니다</div>
                    )}
                  </div>
                )}
              </div>

              {/* 구분 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>구분</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([
                    { v: 'work' as const, label: '업무', color: '#3B6D11', bg: '#EAF3DE', border: '#639922' },
                    { v: 'personal' as const, label: '개인', color: '#185FA5', bg: 'rgba(55,138,221,0.1)', border: '#378ADD' },
                  ]).map(opt => (
                    <button key={opt.v}
                      onClick={() => setForm(f => ({ ...f, color: getEventColor(opt.v, f._visibility), _taskType: opt.v }))}
                      style={{ padding: '5px 14px', fontSize: 10, letterSpacing: '0.06em', cursor: 'pointer', border: `1px solid ${form._taskType === opt.v ? opt.border : '#EDE5DC'}`, background: form._taskType === opt.v ? opt.bg : '#fff', color: form._taskType === opt.v ? opt.color : '#9E8880' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 공개 범위 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>공개 범위</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([
                    { v: 'all' as const, label: '전체', solidColor: '#3B6D11', alphaColor: 'rgba(99,153,34,0.15)', border: '#639922' },
                    { v: 'me' as const, label: '나만', solidColor: '#185FA5', alphaColor: 'rgba(55,138,221,0.15)', border: '#378ADD' },
                    { v: 'specific' as const, label: '지정', solidColor: '#854F0B', alphaColor: 'rgba(186,117,23,0.15)', border: '#BA7517' },
                  ]).map(opt => (
                    <button key={opt.v}
                      onClick={() => setForm(f => ({ ...f, color: getEventColor(f._taskType, opt.v), _visibility: opt.v }))}
                      style={{ padding: '5px 12px', fontSize: 10, letterSpacing: '0.06em', cursor: 'pointer', border: `1px solid ${form._visibility === opt.v ? opt.border : '#EDE5DC'}`, background: form._visibility === opt.v ? opt.alphaColor : '#fff', color: form._visibility === opt.v ? opt.solidColor : '#9E8880' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 미리보기 */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>달력 표시 미리보기</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(() => {
                    const col = form.color;
                    const personal = isPersonal(col);
                    const leave = isLeave(col);
                    const bgColor = personal ? (col === '#639922' ? 'rgba(99,153,34,0.15)' : col === '#378ADD' ? 'rgba(55,138,221,0.15)' : 'rgba(186,117,23,0.15)') : leave ? 'rgba(83,74,183,0.15)' : col;
                    const textColor = personal ? (col === '#639922' ? '#3B6D11' : col === '#378ADD' ? '#185FA5' : '#854F0B') : leave ? '#3C3489' : '#fff';
                    const borderLeft = personal ? `2px solid ${col}` : leave ? '2px solid #534AB7' : 'none';
                    return (
                      <div style={{ fontSize: 10, color: textColor, background: bgColor, padding: '2px 8px', borderRadius: 3, borderLeft, minWidth: 80, maxWidth: 160, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {form.title || '일정 제목'}
                      </div>
                    );
                  })()}
                  <span style={{ fontSize: 10, color: '#C4B8B0' }}>달력에서 이렇게 보여요</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 연차 — 대상자 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>대상자</div>
                {canSelectLeaveTarget ? (
                  <select value={leaveTargetUserId} onChange={e => setLeaveTargetUserId(e.target.value)}
                    style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }}>
                    <option value="">직원 선택</option>
                    {users.filter(u => u.role !== 'admin').map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ width: '100%', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810' }}>
                    {currentUserDisplay}
                  </div>
                )}
              </div>

              {/* 연차 — 날짜 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>날짜</div>
                <div style={{ fontSize: 11, color: '#2C1810', borderBottom: '1px solid #EDE5DC', padding: '6px 0' }}>
                  {(selectedStartDate || form.startDate) === (selectedEndDate || form.endDate || form.startDate)
                    ? (selectedStartDate || form.startDate)
                    : `${selectedStartDate || form.startDate} ~ ${selectedEndDate || form.endDate || form.startDate}`}
                </div>
              </div>

              {/* 연차 — 종류 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>종류</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([{ key: 'full' as const, label: '전일' }, { key: 'half_am' as const, label: '오전반차' }, { key: 'half_pm' as const, label: '오후반차' }]).map(t => (
                    <button key={t.key} onClick={() => setLeaveType(t.key)}
                      style={{ padding: '5px 10px', border: '1px solid ' + (leaveType === t.key ? '#2C1810' : '#EDE5DC'), background: leaveType === t.key ? '#FDF8F4' : '#fff', color: leaveType === t.key ? '#2C1810' : '#9E8880', fontSize: 10, cursor: 'pointer' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 연차 — 메모 */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>메모</div>
                <input value={leaveMemo} onChange={e => setLeaveMemo(e.target.value)} placeholder="선택 입력"
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid #EDE5DC', padding: '8px 0', fontSize: 13, color: '#2C1810', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
              </div>
            </>
          )}
        </div>

        {/* 푸터 */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #EDE5DC', background: '#FDF8F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', bottom: 0 }}>
          <button onClick={onCancel} style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9E8880', background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
          <button onClick={onSubmit} disabled={loading}
            style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', background: loading ? '#9E8880' : '#2C1810', color: '#FDF8F4', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '저장 중...' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
}
