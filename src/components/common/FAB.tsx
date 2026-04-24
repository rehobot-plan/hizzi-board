'use client';

import { useState, type CSSProperties, type MouseEvent } from 'react';

interface FABProps {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  ariaLabel: string;
  icon?: string;
  disabled?: boolean;
  style?: CSSProperties;
  dataTestId?: string;
}

export default function FAB({
  onClick,
  ariaLabel,
  icon = '+',
  disabled = false,
  style,
  dataTestId = 'panel-fab',
}: FABProps) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
      data-testid={dataTestId}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute',
        bottom: 14,
        right: 14,
        width: 44,
        height: 44,
        borderRadius: 22,
        background: hover ? '#1A0E08' : '#2C1810',
        color: '#FDF8F4',
        fontSize: 22,
        fontWeight: 400,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        zIndex: 10,
        border: 'none',
        padding: 0,
        boxShadow: '0 2px 8px rgba(44,20,16,0.15)',
        transform: hover && !disabled ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 0.15s ease, background 0.15s ease',
        ...style,
      }}
    >
      {icon}
    </button>
  );
}
