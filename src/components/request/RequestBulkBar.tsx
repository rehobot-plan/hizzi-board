'use client';

import type { RequestSegmentType } from './RequestSegment';

interface Props {
  segment: RequestSegmentType;
  count: number;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  onCancelAll?: () => void;
  onCompleteAll?: () => void;
  onCancel: () => void;
}

export default function RequestBulkBar({
  segment,
  count,
  onAcceptAll,
  onRejectAll,
  onCancelAll,
  onCompleteAll,
  onCancel,
}: Props) {
  if (count === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 20px',
        borderRadius: 24,
        background: '#FDF8F4',
        border: '1px solid #2C1810',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        zIndex: 50,
        fontSize: 12,
      }}
      data-testid="request-bulk-bar"
    >
      <span style={{ fontWeight: 600, color: '#2C1810' }}>{count}개 선택됨</span>
      <span style={{ color: '#EDE5DC' }}>|</span>

      {segment === 'received' && (
        <>
          {onAcceptAll && <button onClick={onAcceptAll} style={actionBtn('#3B6D11')}>일괄 수락</button>}
          {onRejectAll && <button onClick={onRejectAll} style={actionBtn('#993556')}>일괄 반려</button>}
        </>
      )}
      {segment === 'sent' && (
        <>
          {onCancelAll && <button onClick={onCancelAll} style={actionBtn('#9E8880')}>일괄 취소</button>}
        </>
      )}
      {segment === 'in_progress' && (
        <>
          {onCompleteAll && <button onClick={onCompleteAll} style={actionBtn('#5C7A5C')}>일괄 완료</button>}
        </>
      )}

      <button onClick={onCancel} style={actionBtn('#9E8880')}>취소</button>
    </div>
  );
}

function actionBtn(color: string): React.CSSProperties {
  return {
    fontSize: 11,
    padding: '4px 12px',
    color,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
  };
}
