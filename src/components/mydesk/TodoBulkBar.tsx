'use client';

import { SegmentType } from './TodoSegment';

interface Props {
  segment: SegmentType;
  count: number;
  onComplete?: () => void;
  onTrash?: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
  onCancel: () => void;
}

export default function TodoBulkBar({ segment, count, onComplete, onTrash, onRestore, onPermanentDelete, onCancel }: Props) {
  if (count === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 20px', borderRadius: 24,
      background: '#FDF8F4', border: '1px solid #2C1810',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 50,
      fontSize: 12,
    }} data-testid="bulk-bar">
      <span style={{ fontWeight: 600, color: '#2C1810' }}>{count}개 선택됨</span>
      <span style={{ color: '#EDE5DC' }}>|</span>

      {segment === 'active' && (
        <>
          {onComplete && <button onClick={onComplete} style={actionBtn('#3B6D11')}>완료로</button>}
          {onTrash && <button onClick={onTrash} style={actionBtn('#9E8880')}>휴지통</button>}
        </>
      )}
      {segment === 'completed' && (
        <>
          {onRestore && <button onClick={onRestore} style={actionBtn('#3B6D11')}>되돌리기</button>}
          {onTrash && <button onClick={onTrash} style={actionBtn('#9E8880')}>휴지통</button>}
        </>
      )}
      {segment === 'trash' && (
        <>
          {onRestore && <button onClick={onRestore} style={actionBtn('#3B6D11')}>복원</button>}
          {onPermanentDelete && <button onClick={onPermanentDelete} style={actionBtn('#C17B6B')}>영구삭제</button>}
        </>
      )}

      <button onClick={onCancel} style={actionBtn('#9E8880')}>취소</button>
    </div>
  );
}

function actionBtn(color: string): React.CSSProperties {
  return {
    fontSize: 11, padding: '4px 12px', color, background: 'none',
    border: 'none', cursor: 'pointer', fontWeight: 500,
  };
}
