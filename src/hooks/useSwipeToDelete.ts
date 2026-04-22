'use client';

import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/**
 * patterns.md P9 스와이프 제스처 — 좌←우 드래그로 삭제 확정.
 *
 * - Pointer Events API (터치·마우스·트랙패드 통합)
 * - 임계값 80px 이상 드래그 시 onThresholdReached 호출
 * - 수평 이동량이 수직 10px 초과 전에 먼저 임계 넘으면 스와이프로 해석 (세로 스크롤 충돌 방지)
 * - 우→좌(오른쪽→왼쪽) 방향만 인식. 양수 → 음수 translateX
 */

const SWIPE_THRESHOLD = 80;
const SCROLL_GUARD = 10;

interface UseSwipeToDeleteOptions {
  /** 드래그 거리 80px 초과 시 호출. delete 확정. */
  onThresholdReached: () => void;
  /** 스와이프 비활성 (canEdit 등). */
  disabled?: boolean;
}

interface UseSwipeToDeleteReturn {
  /** translateX 값 (음수). 0 또는 음수만. */
  translateX: number;
  /** 스와이프 중 여부 (시각 피드백용). */
  isSwiping: boolean;
  /** 컨테이너 요소에 spread할 props. */
  handlers: {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void;
  };
}

export function useSwipeToDelete({
  onThresholdReached,
  disabled = false,
}: UseSwipeToDeleteOptions): UseSwipeToDeleteReturn {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const lockedRef = useRef<'swipe' | 'scroll' | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const reset = useCallback(() => {
    startRef.current = null;
    lockedRef.current = null;
    setTranslateX(0);
    setIsSwiping(false);
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (disabled) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startRef.current = { x: e.clientX, y: e.clientY };
      lockedRef.current = null;
    },
    [disabled],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (disabled) return;
      const start = startRef.current;
      if (!start) return;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;

      if (lockedRef.current === null) {
        if (Math.abs(dy) > SCROLL_GUARD && Math.abs(dy) > Math.abs(dx)) {
          // 세로 이동이 먼저 임계 넘으면 스크롤로 해석, 스와이프 포기
          lockedRef.current = 'scroll';
          return;
        }
        if (Math.abs(dx) > SCROLL_GUARD) {
          if (dx < 0) {
            lockedRef.current = 'swipe';
            setIsSwiping(true);
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
          } else {
            // 오른쪽으로 드래그 — 본 범위에선 미할당
            lockedRef.current = 'scroll';
            return;
          }
        }
      }

      if (lockedRef.current === 'swipe') {
        e.preventDefault();
        setTranslateX(Math.max(dx, -200));
      }
    },
    [disabled],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (disabled) { reset(); return; }
      const start = startRef.current;
      if (!start) { reset(); return; }

      if (lockedRef.current === 'swipe') {
        const dx = e.clientX - start.x;
        try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
        if (dx <= -SWIPE_THRESHOLD) {
          onThresholdReached();
        }
      }
      reset();
    },
    [disabled, onThresholdReached, reset],
  );

  const onPointerCancel = useCallback(
    () => { reset(); },
    [reset],
  );

  return {
    translateX,
    isSwiping,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
