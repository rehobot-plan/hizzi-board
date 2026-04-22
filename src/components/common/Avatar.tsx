'use client';

interface Props {
  photoURL?: string;
  name?: string;
  size?: number;
}

export default function Avatar({ photoURL, name, size = 28 }: Props) {
  const common: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (photoURL) {
    return (
      <span
        data-testid="avatar"
        style={common}
      >
        <img
          src={photoURL}
          alt={name || 'profile'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </span>
    );
  }

  return (
    <span
      data-testid="avatar"
      data-empty="true"
      style={{
        ...common,
        background: '#F5F0EE',
        color: '#9E8880',
        fontSize: Math.round(size * 0.45),
        fontWeight: 500,
      }}
    >
      ?
    </span>
  );
}
