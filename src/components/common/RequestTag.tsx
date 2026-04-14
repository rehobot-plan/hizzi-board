'use client';

import { tagColors } from '@/styles/tokens';

export default function RequestTag() {
  return (
    <span style={{
      fontSize: 9, padding: '2px 7px', borderRadius: 3,
      background: tagColors.category.request.bg, color: tagColors.category.request.fg, border: `1px solid ${tagColors.category.request.border}`,
      letterSpacing: '0.04em',
    }}>
      요청
    </span>
  );
}
