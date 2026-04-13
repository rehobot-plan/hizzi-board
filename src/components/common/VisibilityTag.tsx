'use client';

const styles: Record<'전체' | '나만' | '특정', { fg: string; border: string }> = {
  '전체': { fg: '#3B6D11', border: '#639922' },
  '나만': { fg: '#185FA5', border: '#378ADD' },
  '특정': { fg: '#854F0B', border: '#BA7517' },
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
