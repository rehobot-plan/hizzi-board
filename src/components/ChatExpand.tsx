'use client';

// src/components/ChatExpand.tsx
// uxui.md §4 홈 채팅 입력 토큰 · patterns.md P9 · ux-principles.md U14.
// 시나리오 3(공개범위 칩 질의) + 시나리오 4(복수 항목 카드) 대응.

import { useEffect, useRef } from 'react';
import { useChatInputStore } from '@/store/chatInputStore';
import type { ParsedItem } from '@/lib/parseIntent';
import AiBadge from './AiBadge';

const CATEGORY_COLORS = {
  work: '#C17B6B',
  request: '#993556',
  personal: '#7B5EA7',
} as const;

function leftBorderColor(item: ParsedItem): string {
  if (item.requestFrom) return CATEGORY_COLORS.request;
  if (item.taskType === 'personal') return CATEGORY_COLORS.personal;
  return CATEGORY_COLORS.work;
}

function typeLabel(item: ParsedItem): string {
  if (item.requestFrom) return '요청';
  if (item.type === 'schedule') return '일정';
  if (item.type === 'memo') return '메모';
  if (item.taskType === 'personal') return '개인';
  return '업무';
}

function typeTagColor(item: ParsedItem): { bg: string; fg: string } {
  if (item.requestFrom) return { bg: '#FBEAF0', fg: '#993556' };
  if (item.taskType === 'personal') return { bg: '#F0ECF5', fg: '#7B5EA7' };
  return { bg: '#FFF5F2', fg: '#C17B6B' };
}

// ─── 개별 태그 ───
function InlineTag({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 6px',
        fontSize: 9,
        letterSpacing: '0.06em',
        background: bg,
        color: fg,
      }}
    >
      {label}
    </span>
  );
}

function UnsetTag({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 6px',
        fontSize: 9,
        letterSpacing: '0.06em',
        background: '#FFFFFF',
        border: '1px dashed #C4B8B0',
        color: '#9E8880',
      }}
    >
      {label}
    </span>
  );
}

// ─── 파싱 프리뷰 카드 — 단일 항목 ───
function PreviewCard({ item, unsetVisibility }: { item: ParsedItem; unsetVisibility: boolean }) {
  const typeCol = typeTagColor(item);
  return (
    <div
      data-testid="chat-preview"
      data-left-border={leftBorderColor(item)}
      style={{
        background: '#FDFAF8',
        borderLeft: `2px solid ${leftBorderColor(item)}`,
        padding: '12px 14px',
        borderRadius: 3,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 13, color: '#2C1810', marginRight: 4 }}>{item.content}</span>
      <InlineTag label={typeLabel(item)} bg={typeCol.bg} fg={typeCol.fg} />
      {item.dueDate && <InlineTag label={`🕐 ${item.dueDate}`} bg="#F5F0EE" fg="#9E8880" />}
      {item.requestFrom && (
        <InlineTag label={`To ${item.requestFrom.split('@')[0]}`} bg="#FCEEE9" fg="#A0503A" />
      )}
      {unsetVisibility && <UnsetTag label="범위 미정" />}
    </div>
  );
}

// ─── 시나리오 4 항목 카드 ───
function ItemCard({ item, index }: { item: ParsedItem; index: number }) {
  const typeCol = typeTagColor(item);
  return (
    <div
      data-testid={`chat-item-${index}`}
      data-left-border={leftBorderColor(item)}
      style={{
        background: '#FDFAF8',
        borderLeft: `2px solid ${leftBorderColor(item)}`,
        padding: '14px 16px',
        borderRadius: 3,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      {/* 번호 원 */}
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#FFFFFF',
          border: '1px solid #C4B8B0',
          color: '#6B5B52',
          fontSize: 11,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#2C1810', marginBottom: 6 }}>{item.content}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <InlineTag label={typeLabel(item)} bg={typeCol.bg} fg={typeCol.fg} />
          {item.dueDate && <InlineTag label={`🕐 ${item.dueDate}`} bg="#F5F0EE" fg="#9E8880" />}
          {item.requestFrom && (
            <InlineTag label={`To ${item.requestFrom.split('@')[0]}`} bg="#FCEEE9" fg="#A0503A" />
          )}
          {item.visibility === null && <UnsetTag label="범위 미정" />}
        </div>
      </div>
    </div>
  );
}

// ─── 공개범위 칩 ───
function VisibilityChips() {
  const selected = useChatInputStore((s) => s.selectedVisibility);
  const setSelected = useChatInputStore((s) => s.setSelectedVisibility);

  const options: Array<{ value: 'public' | 'private' | 'specific'; label: string }> = [
    { value: 'public', label: '전체' },
    { value: 'private', label: '나만' },
    { value: 'specific', label: '특정' },
  ];

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelected(opt.value)}
            data-testid={`chat-chip-${opt.value}`}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              border: `1px solid ${active ? '#C17B6B' : '#EDE5DC'}`,
              background: active ? '#FFF5F2' : '#FFFFFF',
              color: active ? '#C17B6B' : '#9E8880',
              cursor: 'pointer',
              borderRadius: 2,
              transition: 'all 0.15s ease',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── 푸터 버튼 3종 ───
function Footer({
  canPromote,
  confirmDisabled,
  confirmLabel,
}: {
  canPromote: boolean;
  confirmDisabled: boolean;
  confirmLabel: string;
}) {
  const cancelExpand = useChatInputStore((s) => s.cancelExpand);
  const confirmExpand = useChatInputStore((s) => s.confirmExpand);
  const promoteSidePanel = useChatInputStore((s) => s.promoteSidePanel);

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
      <button
        type="button"
        onClick={cancelExpand}
        data-testid="chat-cancel"
        style={{
          padding: '7px 14px',
          fontSize: 12,
          color: '#9E8880',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        취소
      </button>
      {canPromote && (
        <button
          type="button"
          onClick={promoteSidePanel}
          data-testid="chat-promote"
          style={{
            padding: '7px 14px',
            fontSize: 12,
            color: '#5C1F1F',
            background: '#FFFFFF',
            border: '1px solid #EDE5DC',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#5C1F1F')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#EDE5DC')}
        >
          자세한 대화로
        </button>
      )}
      <button
        type="button"
        onClick={() => void confirmExpand()}
        disabled={confirmDisabled}
        data-testid="chat-confirm"
        style={{
          padding: '7px 14px',
          fontSize: 12,
          color: '#FDF8F4',
          background: confirmDisabled ? '#C4B8B0' : '#2C1810',
          border: 'none',
          cursor: confirmDisabled ? 'default' : 'pointer',
          transition: 'background 0.15s ease',
        }}
      >
        {confirmLabel}
      </button>
    </div>
  );
}

// ─── 메인 ───
export default function ChatExpand() {
  const parseResult = useChatInputStore((s) => s.parseResult);
  const selectedVisibility = useChatInputStore((s) => s.selectedVisibility);
  const cancelExpand = useChatInputStore((s) => s.cancelExpand);
  const rootRef = useRef<HTMLDivElement>(null);

  // 첫 focusable로 포커스 이동 + Esc = 취소
  useEffect(() => {
    const t = setTimeout(() => {
      const first = rootRef.current?.querySelector<HTMLElement>('button, [tabindex]');
      first?.focus();
    }, 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelExpand();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [cancelExpand]);

  if (!parseResult) return null;
  const isMultiple = parseResult.multipleItemsDetected && parseResult.items.length > 1;

  // 시나리오 3 단일 항목 — visibility unset 해소 필요
  const singleItem = !isMultiple ? parseResult.items[0] : null;
  // #19 — chat schedule은 visibility='all' 강등(임시). 칩 영역 숨김 + 확정 제약 면제. #18 완료 시 복구.
  const isScheduleSingle = !isMultiple && singleItem?.type === 'schedule';
  const unsetVisibility = !isMultiple && parseResult.unset.includes('visibility');
  const needsVisibilityChips = unsetVisibility && !isScheduleSingle;
  // 확정 버튼 활성 조건
  // 복수 항목: 전 항목 전 축 매칭 + 전체 unset 없음 (ai-capture-hb.md §6.3 엄격 조건)
  // 단일 항목: visibility unset이면 칩 선택 필요 (schedule은 칩 무시 · 바로 추가 가능)
  const confirmDisabled = isMultiple
    ? parseResult.unset.length > 0 || !parseResult.items.every((it) => it.visibility !== null)
    : needsVisibilityChips && selectedVisibility === null;

  const confirmLabel = isMultiple ? `${parseResult.items.length}개 모두 추가` : '추가';

  return (
    <div
      ref={rootRef}
      data-testid="chat-expand"
      role="region"
      aria-label="AI 파싱 결과 확인"
      style={{
        position: 'relative',
        marginTop: 12,
        background: '#FFFFFF',
        border: '1px solid #EDE5DC',
        borderRadius: 6,
        padding: '20px 24px',
      }}
    >
      {/* 상단 꺾쇠 — 입력 pill과 시각 연결 */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -6,
          left: 40,
          width: 10,
          height: 10,
          background: '#FFFFFF',
          border: '1px solid #EDE5DC',
          borderRight: 'none',
          borderBottom: 'none',
          transform: 'rotate(45deg)',
        }}
      />

      {/* AI 뱃지 + 안내 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <AiBadge />
        <span style={{ fontSize: 12, color: '#6B5B52' }}>
          {isMultiple
            ? `${parseResult.items.length}개 항목이 감지됐습니다.`
            : needsVisibilityChips
              ? '‘공개범위’만 골라주시면 추가합니다.'
              : '다음과 같이 이해했습니다.'}
        </span>
      </div>

      {/* 파싱 프리뷰 / 항목 카드 */}
      {isMultiple ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {parseResult.items.map((item, i) => (
            <ItemCard key={i} item={item} index={i} />
          ))}
        </div>
      ) : (
        singleItem && <PreviewCard item={singleItem} unsetVisibility={needsVisibilityChips} />
      )}

      {/* 공개범위 칩 — 시나리오 3 단일 + visibility unset + schedule 아님(#19 강등). */}
      {needsVisibilityChips && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: '#9E8880', marginBottom: 8, letterSpacing: '0.04em' }}>
            공개범위
          </div>
          <VisibilityChips />
        </div>
      )}

      <Footer
        canPromote={isMultiple}
        confirmDisabled={confirmDisabled}
        confirmLabel={confirmLabel}
      />
    </div>
  );
}
