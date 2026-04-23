'use client';

// src/components/ChatInput.tsx
// uxui.md §4 홈 채팅 입력 토큰 · ux-principles.md U14 인라인 대화 원칙.
// 높이 52 · border-radius 26 · 한 줄 pill · placeholder + 서브라벨.

import { useChatInputStore } from '@/store/chatInputStore';
import ChatExpand from './ChatExpand';

export default function ChatInput() {
  const inputValue = useChatInputStore((s) => s.inputValue);
  const setInputValue = useChatInputStore((s) => s.setInputValue);
  const submit = useChatInputStore((s) => s.submit);
  const processing = useChatInputStore((s) => s.processing);
  const isExpanded = useChatInputStore((s) => s.isExpanded);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || processing) return;
    void submit();
  };

  const hasValue = inputValue.trim().length > 0;

  return (
    <div style={{ width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div
          style={{
            position: 'relative',
            height: 52,
            borderRadius: 26,
            background: '#FFFFFF',
            border: '1px solid #EDE5DC',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 20,
            paddingRight: 8,
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#C4B8B0')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#EDE5DC')}
        >
          {/* 좌측 말풍선 아이콘 */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9E8880"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, marginRight: 10 }}
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="무엇을 추가할까요?"
            disabled={processing || isExpanded}
            data-testid="chat-input"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 14,
              color: '#2C1810',
              minWidth: 0,
            }}
            aria-label="자연어 입력"
          />

          {/* 서브밋 버튼 — 활성/ghost 분기 */}
          <button
            type="submit"
            disabled={!hasValue || processing || isExpanded}
            data-testid="chat-submit"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              border: 'none',
              background: hasValue ? '#2C1810' : '#F5EFE9',
              color: hasValue ? '#FDF8F4' : '#C4B8B0',
              cursor: hasValue && !processing ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease, color 0.15s ease',
              flexShrink: 0,
            }}
            aria-label="추가"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </form>

      {/* 서브라벨 — 확장 영역 열려있을 땐 숨김 (맥락 중복 회피) */}
      {!isExpanded && (
        <div
          style={{
            fontSize: 11,
            color: '#9E8880',
            marginTop: 6,
            paddingLeft: 20,
            letterSpacing: '0.02em',
          }}
        >
          · 말하듯 편하게 쓰시면 AI가 분류해드립니다
        </div>
      )}

      {isExpanded && <ChatExpand />}
    </div>
  );
}
