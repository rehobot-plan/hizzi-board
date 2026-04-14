'use client';

import { tagColors } from '@/styles/tokens';

const styles: Record<'work' | 'personal', { bg: string; fg: string; border: string; label: string }> = {
  work: { bg: tagColors.category.work.bg, fg: tagColors.category.work.fg, border: tagColors.category.work.border, label: '업무' },
  personal: { bg: tagColors.category.personal.bg, fg: tagColors.category.personal.fg, border: tagColors.category.personal.border, label: '개인' },
};

export default function CategoryTag({ kind }: { kind: 'work' | 'personal' }) {
  const s = styles[kind];
  return (
    <span style={{
      fontSize: 9, padding: '2px 7px', borderRadius: 3,
      background: s.bg, color: s.fg, border: `1px solid ${s.border}`,
      letterSpacing: '0.04em',
    }}>
      {s.label}
    </span>
  );
}
