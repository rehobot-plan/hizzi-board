'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useEscClose } from '@/hooks/useEscClose';
import type { AppUser } from '@/store/userStore';
import type { CalendarCategory } from '@/lib/calendar-helpers';
import type { CalendarScope } from '@/hooks/useCalendarFilter';

interface CalendarFilterProps {
  members: string[];
  onMembersChange: (members: string[]) => void;
  categories: CalendarCategory[];
  onCategoriesChange: (cats: CalendarCategory[]) => void;
  allMembers: AppUser[];
  scope: CalendarScope;
  myEmail: string;
  onResetDefaults: () => void;
  onPersist: () => void;
}

const CATEGORY_LABELS: Record<CalendarCategory, string> = {
  work: '업무',
  request: '요청',
  personal: '개인',
};

export default function CalendarFilter({
  members,
  onMembersChange,
  categories,
  onCategoriesChange,
  allMembers,
  scope,
  myEmail,
  onResetDefaults,
  onPersist,
}: CalendarFilterProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = () => {
    if (open) {
      setOpen(false);
      onPersist();
    }
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        onPersist();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onPersist]);

  useEscClose(() => {
    setOpen(false);
    onPersist();
  }, open);

  const memberSet = useMemo(() => new Set(members), [members]);
  const categorySet = useMemo(() => new Set(categories), [categories]);

  const validEmails = useMemo(
    () => allMembers.map(u => u.email).filter((e): e is string => !!e),
    [allMembers],
  );

  const deviations = useMemo(() => {
    let n = 0;
    if (scope === 'team') {
      const isAllMembers =
        members.length === validEmails.length &&
        validEmails.every(e => memberSet.has(e));
      if (!isAllMembers) n++;
    } else {
      const expected = myEmail ? [myEmail] : [];
      const isMeOnly =
        members.length === expected.length &&
        expected.every(e => memberSet.has(e));
      if (!isMeOnly) n++;
    }
    if (categories.length !== 3) n++;
    return n;
  }, [scope, members, validEmails, memberSet, myEmail, categories]);

  const toggleMember = (email: string) => {
    if (memberSet.has(email)) {
      onMembersChange(members.filter(e => e !== email));
    } else {
      onMembersChange([...members, email]);
    }
  };

  const toggleCategory = (cat: CalendarCategory) => {
    if (categorySet.has(cat)) {
      onCategoriesChange(categories.filter(c => c !== cat));
    } else {
      onCategoriesChange([...categories, cat]);
    }
  };

  const selectAllMembers = () => onMembersChange([...validEmails]);
  const clearAllMembers = () => onMembersChange([]);

  const buttonLabel = deviations > 0 ? `필터 • ${deviations}` : '필터 ▾';

  return (
    <div
      ref={rootRef}
      style={{ position: 'relative', display: 'inline-block' }}
      data-testid="calendar-filter-root"
    >
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        data-testid="calendar-filter-toggle"
        style={{
          padding: '6px 14px',
          fontSize: 11,
          letterSpacing: '0.06em',
          color: deviations > 0 ? '#2C1810' : '#9E8880',
          background: deviations > 0 ? '#F6EFE7' : '#fff',
          border: '1px solid #EDE5DC',
          borderRadius: 4,
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
      >
        {buttonLabel}
      </button>
      {open && (
        <div
          data-testid="calendar-filter-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 100,
            background: '#fff',
            border: '1px solid #EDE5DC',
            borderRadius: 4,
            padding: 14,
            minWidth: 260,
            maxWidth: 'calc(100vw - 32px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880' }}>
              담당자
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={selectAllMembers}
                data-testid="calendar-filter-members-all"
                style={{ fontSize: 10, color: '#9E8880', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
              >
                전원
              </button>
              <button
                type="button"
                onClick={clearAllMembers}
                data-testid="calendar-filter-members-clear"
                style={{ fontSize: 10, color: '#9E8880', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
              >
                전체 해제
              </button>
            </div>
          </div>
          <div
            data-testid="calendar-filter-members-list"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}
          >
            {allMembers.map(u => {
              const checked = memberSet.has(u.email);
              return (
                <label
                  key={u.id}
                  data-testid={`calendar-filter-member-${u.email}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#2C1810', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMember(u.email)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{u.name || u.email}</span>
                </label>
              );
            })}
          </div>
          <div style={{ height: 1, background: '#EDE5DC', margin: '0 0 10px' }} />
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E8880', marginBottom: 8 }}>
            카테고리
          </div>
          <div
            data-testid="calendar-filter-categories-list"
            style={{ display: 'flex', gap: 12, marginBottom: 12 }}
          >
            {(Object.keys(CATEGORY_LABELS) as CalendarCategory[]).map(cat => {
              const checked = categorySet.has(cat);
              return (
                <label
                  key={cat}
                  data-testid={`calendar-filter-category-${cat}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#2C1810', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(cat)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{CATEGORY_LABELS[cat]}</span>
                </label>
              );
            })}
          </div>
          <div style={{ height: 1, background: '#EDE5DC', margin: '0 0 10px' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onResetDefaults}
              data-testid="calendar-filter-reset"
              style={{ fontSize: 11, color: '#6B4F3E', background: 'transparent', border: '1px solid #EDE5DC', borderRadius: 3, padding: '5px 10px', cursor: 'pointer' }}
            >
              기본값으로 초기화
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
