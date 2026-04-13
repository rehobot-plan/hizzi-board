'use client';

export default function LeftBorderBar({ color }: { color: string }) {
  return (
    <div style={{
      position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
      background: color, pointerEvents: 'none',
    }} />
  );
}
