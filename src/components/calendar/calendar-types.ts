/** 캘린더 공용 타입 */

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  authorId: string;
  color: string;
  createdAt: { toMillis?: () => number; seconds?: number } | Date;
  authorName?: string;
  repeatGroupId?: string;
  requestId?: string;
  requestFrom?: string;
  requestTitle?: string;
  repeat?: {
    type: string;
    weeklyDay?: string;
    excludeHolidays?: boolean;
    endType?: string;
    endDate?: string;
    endCount?: number;
  };
}

export interface CalendarDisplayEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  authorName?: string;
  authorId?: string;
  source: 'calendar' | 'leave';
  rawCalendar?: CalendarEvent;
  rawLeave?: Record<string, unknown>;
  isSegmentStart?: boolean;
  isSegmentEnd?: boolean;
  isSingleSegment?: boolean;
  displayTitle?: string;
}

export interface CalendarFormState {
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  _taskType: 'work' | 'personal';
  _visibility: 'all' | 'me' | 'specific';
}
