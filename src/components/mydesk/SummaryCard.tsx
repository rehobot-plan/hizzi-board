'use client';

interface SummaryCardProps {
  title: string;
  value: number;
  subLabel: string;
  accentColor: string;
  onClick?: () => void;
}

export default function SummaryCard({ title, value, subLabel, accentColor, onClick }: SummaryCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid #EDE5DC',
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 4,
        padding: '16px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = '#FDF8F4'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
    >
      <div style={{ fontSize: 10, color: '#9E8880', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#2C1810', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: '#9E8880', marginTop: 4 }}>
        {subLabel}
      </div>
    </div>
  );
}
