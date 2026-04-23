// src/lib/parseLocal.ts
// ai-capture-hb.md §3 1단 로컬 파싱 규칙 구현.
// 4축: 날짜 · 타입 · 수신자 · 공개범위 + 복수 항목 감지.

import type {
  ParseIntentInput,
  ParseIntentResult,
  ParsedItem,
  UnsetField,
} from './parseIntent';

// 6인 패널 사용자 매칭 표 — ai-capture-hb.md §3.2
// 각 토큰이 등장하면 해당 이메일을 수신자로 간주.
// 접미사("~님/~씨/~한테/~에게/~에게는/~보고")는 별도 정규식으로 제거.
interface RecipientEntry {
  email: string;
  position: '대표' | '이사' | '팀장' | '사원';
  tokens: string[]; // 고유·부분 매칭 토큰 (직함 단독 제외)
}

const RECIPIENTS: RecipientEntry[] = [
  { email: 'we4458@naver.com', position: '대표', tokens: ['홍아현', '아현', '홍대표'] },
  { email: 'oilpig85@gmail.com', position: '이사', tokens: ['김진우', '진우', '김이사'] },
  { email: 'kkjspfox@naver.com', position: '팀장', tokens: ['조향래', '향래', '조팀장', '조 팀장'] },
  { email: 'heehun96@naver.com', position: '팀장', tokens: ['우희훈', '희훈', '우팀장', '우 팀장'] },
  { email: 'ektmf335@gmail.com', position: '팀장', tokens: ['한다슬', '다슬', '한팀장', '한 팀장'] },
  { email: 'alwjd7175@gmail.com', position: '사원', tokens: ['유미정', '미정', '유사원'] },
];

// 직함 단독 매칭 — "대표/이사/사원"은 1명만 해당 → 단독 매칭 성립.
// "팀장"은 3명 공유 → 직함 단독 시 unset 처리.
const UNIQUE_POSITION_MAP: Record<string, string> = {
  대표: 'we4458@naver.com',
  이사: 'oilpig85@gmail.com',
  사원: 'alwjd7175@gmail.com',
};

const SUFFIX_PATTERN = /(님|씨|한테|에게는|에게|보고)/g;

const WEEKDAY_MAP: Record<string, number> = {
  일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6,
};

// ─── 접속사 감지 (복수 항목 판정, §3.4) ───
// 보수적 판정 — 연결어가 강하게 감지된 경우만 복수로.
const CONNECTOR_PATTERN = /\s(그리고|또|하고)\s|\s뒤에\s/;

// ─── 키워드 ───
const REQUEST_KEYWORDS = ['요청', '부탁', '맡기', '시키', '해주세요', '해달라', '해주라'];
const SCHEDULE_KEYWORDS = ['미팅', '약속', '회의'];
const TIME_PATTERN = /(오전|오후)?\s?\d{1,2}\s?시/;
const TODO_KEYWORDS = ['할일', '처리', '확인', '정리', '해야'];
const PERSONAL_KEYWORDS = ['개인적으로', '사적으로'];

const VIS_PUBLIC = ['다 같이', '모두에게', '전체 공개', '팀 전체', '공지'];
const VIS_PRIVATE = ['나만', '비공개', '혼자'];
// "X님한테만" / "특정인" / "X씨만" — 정규식으로 판정
const VIS_SPECIFIC_MARKER = /한테만|만\s?알려|특정인|씨만/;

// ─── 날짜 유틸 ───
function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, delta: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

function nextWeekdayThisWeek(base: Date, target: number): Date {
  const cur = base.getDay();
  let delta = target - cur;
  if (delta <= 0) delta += 7; // 이미 지난 요일이면 다음 주
  return addDays(base, delta);
}

function nextWeekWeekday(base: Date, target: number): Date {
  // "다음주 X요일" — 다음주는 "base 이후 그 요일의 다음 발생".
  // nextWeekdayThisWeek가 이미 "지나갔으면 다음 주로 넘김" 처리라 그대로 사용.
  return nextWeekdayThisWeek(base, target);
}

function parseAbsoluteMD(text: string, base: Date): string | null {
  // MM.DD / MM/DD / M월 D일
  const m1 = text.match(/(\d{1,2})[./](\d{1,2})/);
  const m2 = text.match(/(\d{1,2})월\s?(\d{1,2})일/);
  const match = m2 || m1;
  if (!match) return null;
  const mm = parseInt(match[1], 10);
  const dd = parseInt(match[2], 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  let year = base.getFullYear();
  const candidate = new Date(year, mm - 1, dd);
  // 지난 날짜면 내년
  if (candidate.getTime() < base.getTime() - 24 * 60 * 60 * 1000) year += 1;
  return toYmd(new Date(year, mm - 1, dd));
}

// ─── 날짜 파싱 ───
function parseDate(text: string, now: Date): { dueDate: string | null; hasTime: boolean } {
  const hasTime = TIME_PATTERN.test(text);

  if (/오늘/.test(text)) return { dueDate: toYmd(now), hasTime };
  if (/내일/.test(text)) return { dueDate: toYmd(addDays(now, 1)), hasTime };
  if (/모레/.test(text)) return { dueDate: toYmd(addDays(now, 2)), hasTime };

  // D-N / D+N
  const relMatch = text.match(/D([+-])(\d+)/i);
  if (relMatch) {
    const sign = relMatch[1] === '-' ? -1 : 1;
    const n = parseInt(relMatch[2], 10);
    return { dueDate: toYmd(addDays(now, sign * n)), hasTime };
  }

  // 다음주 X요일
  const nextWeekMatch = text.match(/다음\s?주\s?([월화수목금토일])요일?/);
  if (nextWeekMatch) {
    const target = WEEKDAY_MAP[nextWeekMatch[1]];
    return { dueDate: toYmd(nextWeekWeekday(now, target)), hasTime };
  }

  // 절대 MM.DD / M월 D일
  const absolute = parseAbsoluteMD(text, now);
  if (absolute) return { dueDate: absolute, hasTime };

  // 요일 단독 — "월요일/화요일/..." or "월/화/..." 단독 (접속사·일반어 오탐 회피 위해 "요일" 포함 우선)
  const weekdayMatch = text.match(/([월화수목금토일])요일/);
  if (weekdayMatch) {
    const target = WEEKDAY_MAP[weekdayMatch[1]];
    return { dueDate: toYmd(nextWeekdayThisWeek(now, target)), hasTime };
  }

  return { dueDate: null, hasTime };
}

// ─── 수신자 매칭 ───
function matchRecipient(text: string): string | null {
  const cleaned = text.replace(SUFFIX_PATTERN, '');

  // 1) 고유 토큰 우선 (이름·성+직함)
  for (const entry of RECIPIENTS) {
    for (const token of entry.tokens) {
      if (cleaned.includes(token)) return entry.email;
    }
  }

  // 2) 직함 단독 매칭 ("대표"·"이사"·"사원"만. "팀장"은 unset)
  for (const [pos, email] of Object.entries(UNIQUE_POSITION_MAP)) {
    // 직함 토큰이 단어 경계로 등장하는지 확인 — "대표이사" 같은 복합어 오탐 방지
    const re = new RegExp(`(?:^|[^가-힣])${pos}(?:[^가-힣]|$)`);
    if (re.test(cleaned)) return email;
  }

  return null;
}

// ─── 타입 판정 ───
function detectType(text: string, recipient: string | null, hasTime: boolean): ParsedItem['type'] {
  // 우선순위: 요청 → 일정 → 할일 → 메모
  if (recipient && REQUEST_KEYWORDS.some((k) => text.includes(k))) return 'todo'; // 요청도 posts type=todo + requestFrom
  if (hasTime || SCHEDULE_KEYWORDS.some((k) => text.includes(k))) return 'schedule';
  if (TODO_KEYWORDS.some((k) => text.includes(k))) return 'todo';
  return 'memo';
}

function detectTaskType(text: string): { value: 'work' | 'personal'; inferred: boolean } {
  if (PERSONAL_KEYWORDS.some((k) => text.includes(k))) return { value: 'personal', inferred: false };
  // 기본값 fallback — 키워드 매칭 없이 'work'로 설정된 경우 추정.
  return { value: 'work', inferred: true };
}

// ─── 공개범위 매칭 ───
function matchVisibility(
  text: string,
  userEmail: string,
  recipient: string | null,
): { visibility: ParsedItem['visibility']; visibleTo: string[] | null } {
  if (VIS_PUBLIC.some((k) => text.includes(k))) {
    return { visibility: 'public', visibleTo: [] };
  }
  if (VIS_PRIVATE.some((k) => text.includes(k))) {
    return { visibility: 'private', visibleTo: [userEmail] };
  }
  if (VIS_SPECIFIC_MARKER.test(text)) {
    const visibleTo = [userEmail];
    if (recipient && !visibleTo.includes(recipient)) visibleTo.push(recipient);
    return { visibility: 'specific', visibleTo };
  }
  return { visibility: null, visibleTo: null };
}

// ─── 단일 항목 파싱 ───
function parseOneSegment(rawText: string, userEmail: string, now: Date): {
  item: ParsedItem;
  unset: UnsetField[];
  inferredCount: number; // 추정 적용된 축 수 (§3.3 0.8 tier)
} {
  const { dueDate, hasTime } = parseDate(rawText, now);
  const recipient = matchRecipient(rawText);
  const type = detectType(rawText, recipient, hasTime);
  const taskType = detectTaskType(rawText);
  const { visibility, visibleTo } = matchVisibility(rawText, userEmail, recipient);

  const unset: UnsetField[] = [];
  if (visibility === null) unset.push('visibility');
  // 요청성 키워드 감지됐으나 수신자 매칭 실패 시 requestFrom unset
  const requestLike = REQUEST_KEYWORDS.some((k) => rawText.includes(k));
  if (requestLike && !recipient) unset.push('requestFrom');
  // 할일·일정에서 dueDate unset은 선택 질의라 여기선 unset 리스트에 포함 안 함
  // (ai-capture-hb.md §4.2 — 기한은 선택적, 첫 구현은 공개범위 질의만 활성)

  const item: ParsedItem = {
    type,
    content: rawText.trim(),
    taskType: taskType.value,
    dueDate,
    requestFrom: recipient,
    visibility,
    visibleTo,
  };

  // 추정 적용된 축 수 (§3.3)
  let inferredCount = 0;
  if (taskType.inferred) inferredCount += 1;

  return { item, unset, inferredCount };
}

// ─── confidence 계산 (§3.3) ───
// 5단계 스냅샷: 1.0 전 축 직접 매칭 · 0.8 1축 추정 · 0.6 1축 unset · 0.4 2축 unset · ≤0.3 타입 unset(드묾)
function computeConfidence(unsetCount: number, inferredCount: number): number {
  if (unsetCount >= 3) return 0.3; // 타입 자체 unset 드물지만 안전망
  if (unsetCount === 2) return 0.4;
  if (unsetCount === 1) return 0.6;
  // unsetCount === 0
  if (inferredCount >= 1) return 0.8;
  return 1.0;
}

// ─── 복수 항목 분리 ───
function splitSegments(rawText: string): string[] {
  if (!CONNECTOR_PATTERN.test(rawText)) return [rawText];
  // 보수적 분리 — 접속사로 1차 split 후 각 구간이 최소 길이 이상일 때만 독립 항목으로.
  const segs = rawText.split(/\s(?:그리고|또|하고)\s|\s뒤에\s/).map((s) => s.trim()).filter(Boolean);
  if (segs.length < 2) return [rawText];
  // 각 구간이 2자 이상일 때만 분리 간주
  if (segs.some((s) => s.length < 2)) return [rawText];
  return segs;
}

// ─── 메인 ───
export function parseLocal(input: ParseIntentInput): ParseIntentResult {
  const now = new Date();
  const segments = splitSegments(input.rawText);
  const multipleItemsDetected = segments.length >= 2;

  const parsedList = segments.map((seg) => parseOneSegment(seg, input.userEmail, now));

  // 전체 confidence = 각 항목 confidence의 평균
  const confidences = parsedList.map((p) => computeConfidence(p.unset.length, p.inferredCount));
  const confidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

  // 전체 unset = 각 항목 unset 축 중 최소 1개라도 있는 축 집합 (중복 제거)
  const unsetSet = new Set<UnsetField>();
  parsedList.forEach((p) => p.unset.forEach((u) => unsetSet.add(u)));

  return {
    items: parsedList.map((p) => p.item),
    confidence,
    unset: Array.from(unsetSet),
    multipleItemsDetected,
  };
}
