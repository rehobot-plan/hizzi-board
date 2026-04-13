'use client';

const styles: Record<'work' | 'personal', { bg: string; fg: string; border: string; label: string }> = {
  work: { bg: '#FFF5F2', fg: '#C17B6B', border: '#C17B6B', label: '업무' },
  personal: { bg: '#F0ECF5', fg: '#7B5EA7', border: '#7B5EA7', label: '개인' },
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
