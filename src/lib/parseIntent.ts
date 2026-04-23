// src/lib/parseIntent.ts
// ai-capture-hb.md §7.1 계약. 3단 AI 캡처 파이프라인의 entry 함수.
// 1단 parseLocal (규칙 기반) 활성 · 2단 LLM stub (첫 구현은 미호출) · 3단은 UI(ChatExpand)에서 처리.

import { parseLocal } from './parseLocal';

export interface ParseIntentInput {
  rawText: string;
  userEmail: string; // 작성자 — 공개범위 "나만" 판정용
}

export interface ParsedItem {
  type: 'todo' | 'memo' | 'schedule';
  content: string;
  taskType: 'work' | 'personal' | null;
  dueDate: string | null; // YYYY-MM-DD
  requestFrom: string | null; // 이메일
  visibility: 'public' | 'private' | 'specific' | null;
  visibleTo: string[] | null;
}

export type UnsetField =
  | 'visibility'
  | 'requestFrom'
  | 'dueDate'
  | 'type';

export interface ParseIntentResult {
  items: ParsedItem[]; // 복수 항목 지원
  confidence: number; // 0~1
  unset: UnsetField[];
  multipleItemsDetected: boolean; // 시나리오 4 판정
}

/**
 * 3단 AI 캡처 파이프라인 entry.
 * 현재 동작: 1단 로컬 파싱 결과 즉시 반환 (2단 LLM stub).
 *
 * 향후 LLM 본체 부착 시:
 * - parseLLM() 본체 구현 (Anthropic Haiku 등)
 * - const llmResult = await parseLLM(input, localResult)
 * - return mergeResults(localResult, llmResult)
 * - ChatMessage.processingState에 "llm_parsed" 단계 추가
 * - posts에 userEdited 필드 추가 (ai-capture-hb.md §7.3)
 */
export async function parseIntent(
  input: ParseIntentInput,
): Promise<ParseIntentResult> {
  const localResult = parseLocal(input);
  // 2단 stub — 향후 LLM 호출 지점.
  // const llmResult = await parseLLM(input, localResult);
  // return mergeResults(localResult, llmResult);
  return localResult;
}
