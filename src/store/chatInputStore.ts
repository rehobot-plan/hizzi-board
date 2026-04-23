// src/store/chatInputStore.ts
// ai-capture-hb.md §6 파이프라인 상태 전이 · chatMessages 컬렉션 I/O · derivedIds cascade.
// 확장 영역 즉시 해소형이라 Question 엔티티 DB 저장 불필요 — 전부 클라이언트 상태로만 관리.

import { create } from 'zustand';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { parseIntent, type ParseIntentResult, type ParsedItem } from '@/lib/parseIntent';
import { usePostStore } from '@/store/postStore';
import { usePanelStore } from '@/store/panelStore';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';

export type ProcessingState = 'local_parsed' | 'awaiting_user' | 'finalized';

export interface DerivedRef {
  type: 'post' | 'calendarEvent';
  id: string;
  status: 'active' | 'cancelled';
}

interface ChatInputState {
  // 입력 pill 상태
  inputValue: string;
  setInputValue: (v: string) => void;

  // 확장 영역 상태 (처리 중 ChatMessage 핸들)
  isExpanded: boolean;
  processing: boolean;
  currentMessageId: string | null; // Firestore chatMessages.id
  currentText: string; // 전송된 원본 (확장 영역 표시용)
  parseResult: ParseIntentResult | null;

  // 시나리오 3 — 사용자가 선택한 공개범위 (visibility unset 해소용)
  selectedVisibility: 'public' | 'private' | 'specific' | null;
  setSelectedVisibility: (v: 'public' | 'private' | 'specific' | null) => void;

  // 액션
  submit: () => Promise<void>; // pill 확정
  confirmExpand: () => Promise<void>; // 확장 영역 "추가" — 시나리오 3·4 본체
  cancelExpand: () => void; // 취소·Esc
  promoteSidePanel: () => void; // 시나리오 4 "자세한 대화로" (placeholder 토스트)
}

// 타입 → 패널 카테고리 매핑
function categoryForType(type: ParsedItem['type']): '할일' | '메모' {
  if (type === 'memo') return '메모';
  return '할일';
}

function tabLabelForType(type: ParsedItem['type']): string {
  if (type === 'memo') return '메모';
  if (type === 'schedule') return '일정';
  return '할일';
}

// 현재 사용자의 본인 패널 ID 조회
function findMyPanelId(userEmail: string): string | null {
  const panels = usePanelStore.getState().panels;
  const mine = panels.find((p) => p.ownerEmail === userEmail);
  return mine?.id ?? null;
}

function findPanelName(panelId: string): string {
  const panel = usePanelStore.getState().panels.find((p) => p.id === panelId);
  return panel?.name ?? '내 패널';
}

// ChatMessage 생성 → Firestore chatMessages 컬렉션에 insert
async function createChatMessage(userEmail: string, rawText: string): Promise<string | null> {
  try {
    const ref = await addDoc(collection(db, 'chatMessages'), {
      userId: userEmail,
      rawText,
      createdAt: serverTimestamp(),
      processingState: 'local_parsed' as ProcessingState,
      parsedAt_local: serverTimestamp(),
      finalizedAt: null,
      derivedIds: [] as DerivedRef[],
      deleted: false,
      deletedAt: null,
    });
    return ref.id;
  } catch (e) {
    console.error('chatMessage create failed:', e);
    useToastStore.getState().addToast({
      message: '메시지 저장에 실패했습니다. 다시 시도해주세요.',
      type: 'error',
    });
    return null;
  }
}

// posts/calendarEvents 생성 — 4필드(sourceMessageId·parseStage·confidence·inputSource) 포함.
// 타입별 컬렉션 분기 (ai-capture-hb.md §3.1, §5.2).
// 반환: { id, collection } | null — DerivedRef.type 채우기용.
async function createFromParsed(
  item: ParsedItem,
  visibility: 'public' | 'private' | 'specific',
  visibleTo: string[],
  userEmail: string,
  panelId: string,
  messageId: string,
  confidence: number,
): Promise<{ id: string; derivedType: 'post' | 'calendarEvent' } | null> {
  const isSchedule = item.type === 'schedule';
  const basePayload: Record<string, unknown> = {
    author: userEmail,
    visibleTo,
    taskType: item.taskType ?? 'work',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    // ai-capture 신규 4필드
    sourceMessageId: messageId,
    parseStage: 'user_confirmed' as const,
    confidence,
    inputSource: 'chat' as const,
  };
  void visibility; // visibleTo로 표현 (public=[] · private=[self] · specific=[self, ...others])

  try {
    if (isSchedule) {
      // calendarEvents 경로
      const payload: Record<string, unknown> = {
        ...basePayload,
        title: item.content,
        panelId, // 본인 패널 소유 이벤트
      };
      if (item.dueDate) payload.date = item.dueDate;
      const ref = await addDoc(collection(db, 'calendarEvents'), payload);
      return { id: ref.id, derivedType: 'calendarEvent' };
    }

    // posts 경로 (todo · memo · request)
    const payload: Record<string, unknown> = {
      ...basePayload,
      panelId,
      content: item.content,
      category: categoryForType(item.type),
    };
    if (item.dueDate) payload.dueDate = item.dueDate;
    if (item.requestFrom) payload.requestFrom = item.requestFrom;
    const ref = await addDoc(collection(db, 'posts'), payload);
    return { id: ref.id, derivedType: 'post' };
  } catch (e) {
    console.error('create from chat failed:', e);
    useToastStore.getState().addToast({
      message: '저장에 실패했습니다. 다시 시도해주세요.',
      type: 'error',
    });
    return null;
  }
}

// ChatMessage finalize — derivedIds append + processingState = finalized
async function finalizeChatMessage(messageId: string, derivedIds: DerivedRef[]): Promise<void> {
  try {
    await updateDoc(doc(db, 'chatMessages', messageId), {
      processingState: 'finalized' as ProcessingState,
      finalizedAt: serverTimestamp(),
      derivedIds,
    });
  } catch (e) {
    console.error('chatMessage finalize failed:', e);
  }
}

async function markAwaitingUser(messageId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'chatMessages', messageId), {
      processingState: 'awaiting_user' as ProcessingState,
    });
  } catch (e) {
    console.error('chatMessage awaiting_user mark failed:', e);
  }
}

// 실행 취소 cascade — 타입별 분기 삭제 + derivedIds[].status = 'cancelled'
async function cancelDerived(messageId: string, derivedIds: DerivedRef[]): Promise<void> {
  const { deletePost } = usePostStore.getState();
  await Promise.all(
    derivedIds
      .filter((d) => d.status === 'active')
      .map(async (d) => {
        try {
          if (d.type === 'post') {
            await deletePost(d.id);
          } else {
            // calendarEvent — soft delete 필드 업데이트
            await updateDoc(doc(db, 'calendarEvents', d.id), {
              deleted: true,
              deletedAt: serverTimestamp(),
            });
          }
        } catch (e) {
          console.error('derived cancel failed:', e);
        }
      }),
  );
  const cancelled: DerivedRef[] = derivedIds.map((d) => ({ ...d, status: 'cancelled' }));
  try {
    await updateDoc(doc(db, 'chatMessages', messageId), { derivedIds: cancelled });
  } catch (e) {
    console.error('chatMessage cancel cascade failed:', e);
  }
}

// 토스트 — 저장 완료 + 실행 취소
function showSuccessToast(panelName: string, tabLabel: string, messageId: string, derivedIds: DerivedRef[]): void {
  const addToast = useToastStore.getState().addToast;
  addToast({
    message: `${panelName} 패널 · ${tabLabel} 탭에 추가됨`,
    type: 'success',
    durationMs: 5000,
    action: {
      label: '실행 취소',
      onClick: async () => {
        await cancelDerived(messageId, derivedIds);
      },
    },
  });
}

export const useChatInputStore = create<ChatInputState>((set, get) => ({
  inputValue: '',
  setInputValue: (v) => set({ inputValue: v }),

  isExpanded: false,
  processing: false,
  currentMessageId: null,
  currentText: '',
  parseResult: null,
  selectedVisibility: null,
  setSelectedVisibility: (v) => set({ selectedVisibility: v }),

  submit: async () => {
    const state = get();
    const raw = state.inputValue.trim();
    if (!raw || state.processing) return;

    const user = useAuthStore.getState().user;
    if (!user?.email) {
      useToastStore.getState().addToast({ message: '로그인이 필요합니다.', type: 'error' });
      return;
    }
    const panelId = findMyPanelId(user.email);
    if (!panelId) {
      useToastStore.getState().addToast({ message: '배정된 패널이 없습니다.', type: 'error' });
      return;
    }

    set({ processing: true });

    // ChatMessage 생성 → Firestore
    const messageId = await createChatMessage(user.email, raw);
    if (!messageId) {
      set({ processing: false });
      return;
    }

    // 1단 + 2단 stub 파싱
    const result = await parseIntent({ rawText: raw, userEmail: user.email });

    // 시나리오 분기
    const clearFinal = { inputValue: '', processing: false };

    // 시나리오 4 — 복수 항목: 확장 영역 펼침 + 항목 카드
    if (result.multipleItemsDetected) {
      await markAwaitingUser(messageId);
      set({
        isExpanded: true,
        processing: false,
        currentMessageId: messageId,
        currentText: raw,
        parseResult: result,
        selectedVisibility: null,
      });
      return;
    }

    // 시나리오 2 — 명확 즉시 저장 (confidence >= 0.7 + unset 없음)
    const isClear = result.confidence >= 0.7 && result.unset.length === 0;
    if (isClear && result.items.length === 1) {
      const item = result.items[0];
      const vis = item.visibility ?? 'public';
      const visTo = item.visibleTo ?? [];
      const created = await createFromParsed(
        item,
        vis,
        visTo,
        user.email,
        panelId,
        messageId,
        result.confidence,
      );
      if (created) {
        const derived: DerivedRef[] = [{ type: created.derivedType, id: created.id, status: 'active' }];
        await finalizeChatMessage(messageId, derived);
        showSuccessToast(findPanelName(panelId), tabLabelForType(item.type), messageId, derived);
      }
      set({
        ...clearFinal,
        isExpanded: false,
        currentMessageId: null,
        currentText: '',
        parseResult: null,
        selectedVisibility: null,
      });
      return;
    }

    // 시나리오 3 — 애매 (unset 축 1개 이상 또는 confidence < 0.7)
    await markAwaitingUser(messageId);
    set({
      isExpanded: true,
      processing: false,
      currentMessageId: messageId,
      currentText: raw,
      parseResult: result,
      selectedVisibility: null,
    });
  },

  confirmExpand: async () => {
    const state = get();
    const user = useAuthStore.getState().user;
    if (!user?.email) return;
    if (!state.parseResult || !state.currentMessageId) return;

    const panelId = findMyPanelId(user.email);
    if (!panelId) return;

    // 시나리오 4 "N개 모두 추가" — 엄격 판정: 모든 항목 전 축 매칭 + 전체 unset 없음
    // (ai-capture-hb.md §6.3). 부분 unset은 인라인 개별 확정 or B 승격.
    if (state.parseResult.items.length > 1) {
      const allClear =
        state.parseResult.unset.length === 0 &&
        state.parseResult.items.every((it) => it.visibility !== null);
      if (!allClear) {
        useToastStore.getState().addToast({
          message: '각 항목 확정 필요 — 자세한 대화로 이동해주세요.',
          type: 'info',
          durationMs: 3000,
        });
        return;
      }
      // 모든 항목 전 축 매칭 — 각 항목별 타입 분기 저장
      const derived: DerivedRef[] = [];
      for (const item of state.parseResult.items) {
        const vis = item.visibility ?? 'public';
        const visTo = item.visibleTo ?? [];
        const created = await createFromParsed(
          item,
          vis,
          visTo,
          user.email,
          panelId,
          state.currentMessageId,
          state.parseResult.confidence,
        );
        if (created) derived.push({ type: created.derivedType, id: created.id, status: 'active' });
      }
      if (derived.length > 0) {
        await finalizeChatMessage(state.currentMessageId, derived);
        showSuccessToast(findPanelName(panelId), `${derived.length}개 항목`, state.currentMessageId, derived);
      }
      set({
        isExpanded: false,
        currentMessageId: null,
        currentText: '',
        parseResult: null,
        selectedVisibility: null,
      });
      return;
    }

    // 시나리오 3 — 단일 항목 · visibility 확정
    const item = state.parseResult.items[0];
    const resolvedVisibility = state.selectedVisibility ?? item.visibility ?? 'public';
    let visibleTo: string[];
    if (resolvedVisibility === 'public') visibleTo = [];
    else if (resolvedVisibility === 'private') visibleTo = [user.email];
    else {
      // specific — 수신자 있으면 포함
      visibleTo = [user.email];
      if (item.requestFrom && !visibleTo.includes(item.requestFrom)) visibleTo.push(item.requestFrom);
    }

    const created = await createFromParsed(
      item,
      resolvedVisibility,
      visibleTo,
      user.email,
      panelId,
      state.currentMessageId,
      state.parseResult.confidence,
    );
    if (created) {
      const derived: DerivedRef[] = [{ type: created.derivedType, id: created.id, status: 'active' }];
      await finalizeChatMessage(state.currentMessageId, derived);
      showSuccessToast(findPanelName(panelId), tabLabelForType(item.type), state.currentMessageId, derived);
    }

    set({
      isExpanded: false,
      currentMessageId: null,
      currentText: '',
      parseResult: null,
      selectedVisibility: null,
    });
  },

  cancelExpand: () => {
    const state = get();
    // posts 미생성. ChatMessage는 유지(원본 보존) + processingState = finalized로 마감.
    if (state.currentMessageId) {
      void updateDoc(doc(db, 'chatMessages', state.currentMessageId), {
        processingState: 'finalized' as ProcessingState,
        finalizedAt: serverTimestamp(),
      }).catch((e) => console.error('chatMessage cancel finalize failed:', e));
    }
    set({
      isExpanded: false,
      currentMessageId: null,
      currentText: '',
      parseResult: null,
      selectedVisibility: null,
    });
  },

  promoteSidePanel: () => {
    // 시나리오 4 "자세한 대화로" — 본 범위 placeholder 토스트.
    useToastStore.getState().addToast({
      message: '준비 중 — 인라인에서 각 항목 확정해주세요',
      type: 'info',
      durationMs: 3000,
    });
  },
}));
