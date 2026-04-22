/**
 * 날짜 유틸리티 — MY DESK 오늘 탭 등에서 사용.
 * dateStr = 'YYYY-MM-DD' 로컬 시간 기준.
 */

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isToday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  return dateStr === formatDateKey(new Date());
}

export function isThisWeek(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const now = new Date();
  const day = now.getDay(); // 0=일
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  const target = new Date(dateStr + 'T00:00:00');
  return target >= start && target < end;
}

export function daysUntil(dateStr: string | undefined): number {
  if (!dateStr) return Infinity;
  const today = startOfDay(new Date());
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
