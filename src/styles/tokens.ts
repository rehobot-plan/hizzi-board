/**
 * 디자인 토큰 — md/ui/uxui.md 단일 출처
 *
 * CSS Variables 참조: src/app/globals.css :root
 * Phase 5-C에서 하드코딩 hex → 이 상수로 교체 예정
 */

// ─── 컬러 (uxui.md "2. 컬러 팔레트") ────────────────────

export const colors = {
  sidebarBg: 'var(--sidebar-bg)',
  mainBg: 'var(--main-bg)',
  cardBg: 'var(--card-bg)',
  accent: 'var(--accent)',
  activeText: 'var(--active-text)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textHint: 'var(--text-hint)',
  border: 'var(--color-border)',
  todoWorkBg: 'var(--todo-work-bg)',
  todoPersonalBg: 'var(--todo-personal-bg)',
  requestBg: 'var(--request-bg)',
  overlay: 'var(--overlay)',
  todayBg: 'var(--today-bg)',
  saturdayText: '#6B8BC1',
  divider: '#D5C9C0',
  subCardBg: '#FDFAF8',
  altRowBg: '#F5EFE9',
} as const;

// ─── 캘린더 이벤트 색상 (uxui.md "4. 색상 의미 시스템") ─

export const calendarEvent = {
  work: {
    all: '#3B6D11',
    meOnly: '#185FA5',
    specific: '#854F0B',
    rangeBg: '#EAF3DE',
  },
  personal: {
    all: { border: '#639922', bg: 'rgba(99,153,34,0.15)' },
    meOnly: { border: '#378ADD', bg: 'rgba(55,138,221,0.15)' },
    specific: { border: '#BA7517', bg: 'rgba(186,117,23,0.15)' },
  },
  leave: { border: '#534AB7', bg: 'rgba(83,74,183,0.15)', text: '#3C3489' },
  request: { bg: '#993556', border: '#72243E', bgLight: '#FFF9F7' },
  completed: { bg: '#F0F5F0', fg: '#5C7A5C' },
} as const;

// ─── 태그 색상 (uxui.md 할일/메모 태그) ─────────────────

export const tagColors = {
  category: {
    work: { bg: '#FFF5F2', fg: '#C17B6B', border: '#C17B6B' },
    personal: { bg: '#F0ECF5', fg: '#7B5EA7', border: '#7B5EA7' },
    request: { bg: '#FBEAF0', fg: '#993556', border: '#993556' },
  },
  visibility: {
    all: { fg: '#3B6D11', border: '#639922' },
    meOnly: { fg: '#185FA5', border: '#378ADD' },
    specific: { fg: '#854F0B', border: '#BA7517' },
  },
  from: { bg: '#FCEEE9', fg: '#A0503A' },
  team: { bg: '#F5F0EE', fg: '#9E8880' },
  dueSoon: { fg: '#993556', bg: '#FBEAF0', border: '#993556' },
  dueLater: { fg: '#C17B6B', bg: '#FFF5F2', border: '#C17B6B' },
  dueSoonLight: '#F4C0D1',
} as const;

// ─── z-index 계층 (rules-detail.md R8.4) ────────────────

export const zIndex = {
  panel: 10,
  dropdown: 100,
  calendarModal: 50,
  calendarMore: 70,
  modalOverlay: 1000,
  modalBody: 1001,
  imageViewer: 1100,
  toast: 9999,
} as const;

// ─── 타이포그래피 (uxui.md "3. 타이포그래피") ───────────

export const typography = {
  sectionLabel: { size: 11, weight: 700, tracking: '0.1em', case: 'uppercase' as const },
  body: { size: 13, weight: 400 },
  meta: { size: 11, weight: 400 },
  hint: { size: 10, weight: 400, tracking: '0.06em' },
} as const;
