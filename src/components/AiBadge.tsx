// src/components/AiBadge.tsx
// uxui.md §4 홈 채팅 입력 토큰 — AI 뱃지 서브블록

export default function AiBadge() {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 6px',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.12em',
        background: '#5C1F1F',
        color: '#FDF8F4',
      }}
    >
      AI
    </span>
  );
}
