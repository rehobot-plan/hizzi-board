'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import type { CalendarCategory } from '@/lib/calendar-helpers';

export type CalendarScope = 'team' | 'me';

const ALL_CATEGORIES: readonly CalendarCategory[] = ['work', 'request', 'personal'];

function storageKey(scope: CalendarScope): string {
  return `hizzi.calendar.filter.${scope}`;
}

function computeDefaults(
  scope: CalendarScope,
  allEmails: string[],
  myEmail: string,
): { members: string[]; categories: CalendarCategory[] } {
  return {
    members: scope === 'team' ? [...allEmails] : (myEmail ? [myEmail] : []),
    categories: [...ALL_CATEGORIES],
  };
}

export interface CalendarFilterState {
  members: string[];
  categories: CalendarCategory[];
  setMembers: (m: string[]) => void;
  setCategories: (c: CalendarCategory[]) => void;
  resetDefaults: () => void;
  persist: () => void;
}

export function useCalendarFilter(scope: CalendarScope = 'team'): CalendarFilterState {
  const myEmail = useAuthStore(s => s.user?.email || '');
  const users = useUserStore(s => s.users);

  const [members, setMembersState] = useState<string[]>([]);
  const [categories, setCategoriesState] = useState<CalendarCategory[]>([...ALL_CATEGORIES]);
  const loadedRef = useRef(false);

  // scope 변경 시 저장소 키가 바뀌므로 재로드 (블록 ⑤ 패널 내부 '나만/전체' 이진 토글).
  useEffect(() => { loadedRef.current = false; }, [scope]);

  useEffect(() => {
    if (loadedRef.current) return;
    if (users.length === 0) return;
    loadedRef.current = true;
    const allEmails = users.map(u => u.email).filter((e): e is string => !!e);
    const defaults = computeDefaults(scope, allEmails, myEmail);
    try {
      const raw = typeof window !== 'undefined'
        ? window.localStorage.getItem(storageKey(scope))
        : null;
      if (raw) {
        const parsed = JSON.parse(raw) as { members?: unknown; categories?: unknown };
        const validEmailSet = new Set(allEmails);
        const savedMembers = Array.isArray(parsed.members)
          ? parsed.members.filter(
              (e): e is string => typeof e === 'string' && validEmailSet.has(e),
            )
          : null;
        const savedCategories = Array.isArray(parsed.categories)
          ? parsed.categories.filter(
              (c): c is CalendarCategory =>
                c === 'work' || c === 'request' || c === 'personal',
            )
          : null;
        setMembersState(savedMembers ?? defaults.members);
        setCategoriesState(savedCategories ?? defaults.categories);
        return;
      }
    } catch {
      // parse failure falls through to defaults
    }
    setMembersState(defaults.members);
    setCategoriesState(defaults.categories);
  }, [scope, users, myEmail]);

  const resetDefaults = () => {
    const allEmails = users.map(u => u.email).filter((e): e is string => !!e);
    const d = computeDefaults(scope, allEmails, myEmail);
    setMembersState(d.members);
    setCategoriesState(d.categories);
  };

  const persist = () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        storageKey(scope),
        JSON.stringify({ members, categories }),
      );
    } catch {
      // ignore quota / serialization errors
    }
  };

  return {
    members,
    categories,
    setMembers: setMembersState,
    setCategories: setCategoriesState,
    resetDefaults,
    persist,
  };
}
