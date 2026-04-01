import { create } from 'zustand';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type LeaveType = 'full' | 'half_am' | 'half_pm';

export interface LeaveSetting {
  id: string;
  userId: string;
  userName: string;
  joinDate: string;
  manualUsedDays: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LeaveEvent {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  date: string;
  type: LeaveType;
  days: number;
  memo?: string;
  confirmed: boolean;
  createdAt?: Date;
  createdBy: string;
}

interface LeaveState {
  settings: LeaveSetting[];
  events: LeaveEvent[];
  loading: boolean;
  upsertSetting: (payload: Omit<LeaveSetting, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addLeaveEvent: (payload: Omit<LeaveEvent, 'id' | 'confirmed' | 'createdAt'>) => Promise<void>;
  updateLeaveEvent: (id: string, updates: Partial<Omit<LeaveEvent, 'id' | 'createdAt'>>) => Promise<void>;
  deleteLeaveEvent: (id: string) => Promise<void>;
}

function todayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  return fallback;
}

export function calcAnnualLeave(joinDate: string, nowDate = new Date()): number {
  if (!joinDate) return 0;
  const join = parseLocalDate(joinDate);
  const years = (nowDate.getTime() - join.getTime()) / (1000 * 60 * 60 * 24 * 365);

  if (years < 1) {
    const months = Math.floor(years * 12);
    return Math.min(Math.max(months, 0), 11);
  }

  const extra = Math.floor((Math.floor(years) - 1) / 2);
  return Math.min(15 + Math.max(extra, 0), 25);
}

function normalizedToday(nowDate = new Date()): Date {
  const today = new Date(nowDate);
  today.setHours(0, 0, 0, 0);
  return today;
}

// 확정 사용 (오늘 포함 지난 날짜)
export function calcConfirmedLeave(events: LeaveEvent[], _manualUsed = 0, nowDate = new Date()): number {
  const today = normalizedToday(nowDate);
  return events
    .filter((e) => new Date(e.date + 'T00:00:00') <= today)
    .reduce((sum, e) => sum + (Number(e.days) || 0), 0);
}

// 예정 사용 (오늘 이후 날짜)
export function calcPlannedLeave(events: LeaveEvent[], nowDate = new Date()): number {
  const today = normalizedToday(nowDate);
  return events
    .filter((e) => new Date(e.date + 'T00:00:00') > today)
    .reduce((sum, e) => sum + (Number(e.days) || 0), 0);
}

// 총 사용 = 수동입력 + 확정 + 예정
export function calcTotalUsed(events: LeaveEvent[], manualUsed: number, nowDate = new Date()): number {
  return (Number(manualUsed) || 0) + calcConfirmedLeave(events, manualUsed, nowDate) + calcPlannedLeave(events, nowDate);
}

// 이전 사용처 호환용: 확정 사용량 반환
export function calcUsedLeave(events: LeaveEvent[], manualUsed: number, nowDate = new Date()): number {
  return calcConfirmedLeave(events, manualUsed, nowDate);
}

// 잔여 = 발생 - 총사용 (마이너스 허용)
export function calcRemainingLeave(joinDate: string, events: LeaveEvent[], manualUsed: number, nowDate = new Date()): number {
  const total = calcAnnualLeave(joinDate, nowDate);
  const totalUsed = calcTotalUsed(events, manualUsed, nowDate);
  return total - totalUsed;
}

export function canViewLeaveLedger(params: {
  targetUserId: string;
  targetUserEmail?: string;
  currentEmail?: string | null;
  currentRole?: string;
}): boolean {
  const { targetUserEmail, currentEmail, currentRole } = params;
  if (currentRole === 'admin') return true;
  if (!currentEmail) return false;
  return !!targetUserEmail && targetUserEmail === currentEmail;
}

function normalizeLeaveEvent(raw: any, id: string): LeaveEvent {
  const date = raw.date || '';
  const isConfirmed = parseLocalDate(date) <= todayStart();
  return {
    id,
    userId: raw.userId || '',
    userName: raw.userName || '',
    userEmail: raw.userEmail || '',
    date,
    type: raw.type || 'full',
    days: toNumber(raw.days, 1),
    memo: raw.memo || '',
    confirmed: typeof raw.confirmed === 'boolean' ? raw.confirmed || isConfirmed : isConfirmed,
    createdAt: raw.createdAt?.toDate ? raw.createdAt.toDate() : raw.createdAt,
    createdBy: raw.createdBy || '',
  };
}

export const useLeaveStore = create<LeaveState>((set, get) => ({
  settings: [],
  events: [],
  loading: true,

  upsertSetting: async (payload) => {
    const found = get().settings.find((s) => s.userId === payload.userId);
    const data = {
      ...payload,
      manualUsedDays: toNumber(payload.manualUsedDays, 0),
      updatedAt: new Date(),
    };

    try {
      if (found) {
        await updateDoc(doc(db, 'leaveSettings', found.id), data);
      } else {
        await addDoc(collection(db, 'leaveSettings'), {
          ...data,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error upserting leave setting:', error);
    }
  },

  addLeaveEvent: async (payload) => {
    const confirmed = parseLocalDate(payload.date) <= todayStart();
    try {
      await addDoc(collection(db, 'leaveEvents'), {
        ...payload,
        confirmed,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error adding leave event:', error);
    }
  },

  updateLeaveEvent: async (id, updates) => {
    const nextDate = updates.date;
    const confirmed = nextDate ? parseLocalDate(nextDate) <= todayStart() : updates.confirmed;

    try {
      await updateDoc(doc(db, 'leaveEvents', id), {
        ...updates,
        ...(typeof confirmed === 'boolean' ? { confirmed } : {}),
      });
    } catch (error) {
      console.error('Error updating leave event:', error);
    }
  },

  deleteLeaveEvent: async (id) => {
    try {
      await deleteDoc(doc(db, 'leaveEvents', id));
    } catch (error) {
      console.error('Error deleting leave event:', error);
    }
  },
}));

try {
  onSnapshot(
    collection(db, 'leaveSettings'),
    (snapshot) => {
      const settings = snapshot.docs.map((docRef) => {
        const data = docRef.data() as any;
        return {
          id: docRef.id,
          userId: data.userId || '',
          userName: data.userName || '',
          joinDate: data.joinDate || '',
          manualUsedDays: toNumber(data.manualUsedDays, 0),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as LeaveSetting;
      });

      useLeaveStore.setState({ settings, loading: false });
    },
    (error) => {
      console.error('Leave settings listener error:', error);
      useLeaveStore.setState({ settings: [], loading: false });
    }
  );

  onSnapshot(
    collection(db, 'leaveEvents'),
    (snapshot) => {
      const events = snapshot.docs.map((docRef) => normalizeLeaveEvent(docRef.data(), docRef.id));
      useLeaveStore.setState({ events, loading: false });

      // 날짜가 지난 일정은 자동 확정
      events.forEach((event) => {
        const shouldConfirm = parseLocalDate(event.date) <= todayStart();
        if (shouldConfirm && !event.confirmed) {
          updateDoc(doc(db, 'leaveEvents', event.id), { confirmed: true }).catch((error) => {
            console.error('Leave confirm update failed:', error);
          });
        }
      });
    },
    (error) => {
      console.error('Leave events listener error:', error);
      useLeaveStore.setState({ events: [], loading: false });
    }
  );
} catch (error) {
  console.error('Leave store init error:', error);
  useLeaveStore.setState({ loading: false });
}
