import { create } from "zustand";
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToastStore } from "@/store/toastStore";

export type LeaveType = "full" | "half_am" | "half_pm";

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
  upsertSetting: (payload: Omit<LeaveSetting, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  addLeaveEvent: (payload: Omit<LeaveEvent, "id" | "confirmed" | "createdAt">) => Promise<void>;
  updateLeaveEvent: (id: string, updates: Partial<Omit<LeaveEvent, "id" | "createdAt">>) => Promise<void>;
  deleteLeaveEvent: (id: string) => Promise<void>;
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach((k) => {
    if ((cleaned as Record<string, unknown>)[k] === undefined)
      delete (cleaned as Record<string, unknown>)[k];
  });
  return cleaned as Partial<T>;
}

function todayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  return fallback;
}

export function calcAnnualLeave(joinDate: string): number {
  if (!joinDate) return 0;
  const join = new Date(joinDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalDays = (today.getTime() - join.getTime()) / (1000 * 60 * 60 * 24);
  const totalMonths = Math.floor(totalDays / 30.44);
  const totalYears = Math.floor(totalDays / 365.25);
  const under1Year = Math.min(totalMonths, 11);
  if (totalYears < 1) return under1Year;
  const over1Year = Math.min(15 + Math.floor((totalYears - 1) / 2), 25);
  return Math.min(under1Year + over1Year, 26);
}

function normalizedToday(nowDate = new Date()): Date {
  const today = new Date(nowDate);
  today.setHours(0, 0, 0, 0);
  return today;
}

export function calcConfirmedLeave(events: LeaveEvent[], _manualUsed = 0, nowDate = new Date()): number {
  const today = normalizedToday(nowDate);
  return events
    .filter((e) => new Date(e.date + "T00:00:00") <= today)
    .reduce((sum, e) => sum + (Number(e.days) || 0), 0);
}

export function calcPlannedLeave(events: LeaveEvent[], nowDate = new Date()): number {
  const today = normalizedToday(nowDate);
  return events
    .filter((e) => new Date(e.date + "T00:00:00") > today)
    .reduce((sum, e) => sum + (Number(e.days) || 0), 0);
}

export function calcTotalUsed(events: LeaveEvent[], manualUsed: number, nowDate = new Date()): number {
  return (Number(manualUsed) || 0) + calcConfirmedLeave(events, manualUsed, nowDate) + calcPlannedLeave(events, nowDate);
}

export function calcUsedLeave(events: LeaveEvent[], manualUsed: number, nowDate = new Date()): number {
  return calcConfirmedLeave(events, manualUsed, nowDate);
}

export function calcRemainingLeave(joinDate: string, events: LeaveEvent[], manualUsed: number, nowDate = new Date()): number {
  const total = calcAnnualLeave(joinDate);
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
  if (currentRole === "admin") return true;
  if (!currentEmail) return false;
  return !!targetUserEmail && targetUserEmail === currentEmail;
}

function normalizeLeaveEvent(raw: Record<string, unknown>, id: string): LeaveEvent {
  const date = (raw.date as string) || "";
  const isConfirmed = parseLocalDate(date) <= todayStart();
  return {
    id,
    userId: (raw.userId as string) || "",
    userName: (raw.userName as string) || "",
    userEmail: (raw.userEmail as string) || "",
    date,
    type: (raw.type as LeaveType) || "full",
    days: toNumber(raw.days, 1),
    memo: (raw.memo as string) || "",
    confirmed: typeof raw.confirmed === "boolean" ? raw.confirmed || isConfirmed : isConfirmed,
    createdAt: (raw.createdAt as { toDate?: () => Date })?.toDate
      ? (raw.createdAt as { toDate: () => Date }).toDate()
      : (raw.createdAt as Date | undefined),
    createdBy: (raw.createdBy as string) || "",
  };
}

export const useLeaveStore = create<LeaveState>((set, get) => ({
  settings: [],
  events: [],
  loading: true,

  upsertSetting: async (payload) => {
    const found = get().settings.find((s) => s.userId === payload.userId);
    const data = stripUndefined({
      ...payload,
      manualUsedDays: toNumber(payload.manualUsedDays, 0),
      updatedAt: new Date(),
    });
    try {
      if (found) {
        await updateDoc(doc(db, "leaveSettings", found.id), data);
      } else {
        await addDoc(collection(db, "leaveSettings"), { ...data, createdAt: new Date() });
      }
    } catch (error) {
      console.error("Error upserting leave setting:", error);
      throw error;
    }
  },

  addLeaveEvent: async (payload) => {
    const confirmed = parseLocalDate(payload.date) <= todayStart();
    try {
      await addDoc(collection(db, "leaveEvents"), stripUndefined({
        ...payload,
        confirmed,
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error("Error adding leave event:", error);
      throw error;
    }
  },

  updateLeaveEvent: async (id, updates) => {
    const nextDate = updates.date;
    const confirmed = nextDate ? parseLocalDate(nextDate) <= todayStart() : updates.confirmed;
    try {
      await updateDoc(doc(db, "leaveEvents", id), stripUndefined({
        ...updates,
        ...(typeof confirmed === "boolean" ? { confirmed } : {}),
      }));
    } catch (error) {
      console.error("Error updating leave event:", error);
      throw error;
    }
  },

  deleteLeaveEvent: async (id) => {
    try {
      await deleteDoc(doc(db, "leaveEvents", id));
    } catch (error) {
      console.error("Error deleting leave event:", error);
      throw error;
    }
  },
}));

let leaveUnsubscribe1: (() => void) | null = null;
let leaveUnsubscribe2: (() => void) | null = null;

export const initLeaveListener = () => {
  if (leaveUnsubscribe1) { leaveUnsubscribe1(); leaveUnsubscribe1 = null; }
  if (leaveUnsubscribe2) { leaveUnsubscribe2(); leaveUnsubscribe2 = null; }

  leaveUnsubscribe1 = onSnapshot(
    collection(db, "leaveSettings"),
    (snapshot) => {
      const settings = snapshot.docs.map((docRef) => {
        const data = docRef.data() as Record<string, unknown>;
        return {
          id: docRef.id,
          userId: (data.userId as string) || "",
          userName: (data.userName as string) || "",
          joinDate: (data.joinDate as string) || "",
          manualUsedDays: toNumber(data.manualUsedDays, 0),
          createdAt: (data.createdAt as { toDate?: () => Date })?.toDate
            ? (data.createdAt as { toDate: () => Date }).toDate()
            : (data.createdAt as Date | undefined),
          updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate
            ? (data.updatedAt as { toDate: () => Date }).toDate()
            : (data.updatedAt as Date | undefined),
        } as LeaveSetting;
      });
      useLeaveStore.setState({ settings });
    },
    (error) => {
      console.error("Leave settings listener error:", error);
      useToastStore.getState().addToast({ message: "연차 설정 데이터를 불러오지 못했습니다.", type: "error" });
      useLeaveStore.setState({ settings: [], loading: false });
    }
  );

  leaveUnsubscribe2 = onSnapshot(
    collection(db, "leaveEvents"),
    (snapshot) => {
      const events = snapshot.docs.map((docRef) =>
        normalizeLeaveEvent(docRef.data() as Record<string, unknown>, docRef.id)
      );
      useLeaveStore.setState({ events, loading: false });

      // 날짜가 지난 일정 자동 확정
      events.forEach((event) => {
        const shouldConfirm = parseLocalDate(event.date) <= todayStart();
        if (shouldConfirm && !event.confirmed) {
          updateDoc(doc(db, "leaveEvents", event.id), { confirmed: true }).catch((error) => {
            console.error("Leave confirm update failed:", error);
          });
        }
      });
    },
    (error) => {
      console.error("Leave events listener error:", error);
      useToastStore.getState().addToast({ message: "연차 내역을 불러오지 못했습니다.", type: "error" });
      useLeaveStore.setState({ events: [], loading: false });
    }
  );

  return () => {
    if (leaveUnsubscribe1) { leaveUnsubscribe1(); leaveUnsubscribe1 = null; }
    if (leaveUnsubscribe2) { leaveUnsubscribe2(); leaveUnsubscribe2 = null; }
  };
};
