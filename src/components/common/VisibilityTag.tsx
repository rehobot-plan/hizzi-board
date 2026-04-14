'use client';

import { tagColors } from '@/styles/tokens';

const styles: Record<'전체' | '나만' | '특정', { fg: string; border: string }> = {
  '전체': { fg: tagColors.visibility.all.fg, border: tagColors.visibility.all.border },
  '나만': { fg: tagColors.visibility.meOnly.fg, border: tagColors.visibility.meOnly.border },
  '특정': { fg: tagColors.visibility.specific.fg, border: tagColors.visibility.specific.border },
};

export default function VisibilityTag({ visibility }: { visibility: '전체' | '나만' | '특정' }) {
  const s = styles[visibility];
  return (
    <span style={{
      fontSize: 9, padding: '2px 7px', borderRadius: 3,
      background: 'transparent', color: s.fg, border: `1px solid ${s.border}`,
      letterSpacing: '0.04em',
    }}>
      {visibility}
    </span>
  );
}

export function getVisibilityLabel(visibleTo: string[] | undefined, author: string): '전체' | '나만' | '특정' {
  if (!visibleTo || visibleTo.length === 0) return '전체';
  if (visibleTo.length === 1 && visibleTo[0] === author) return '나만';
  return '특정';
}
