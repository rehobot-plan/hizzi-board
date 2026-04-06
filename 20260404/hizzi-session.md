# Hizzi Board — Session Log

> **New session prompt:**
> Attach all 5 MDs: `hizzi-master.md` + `hizzi-rules.md` + `hizzi-flows.md` + `hizzi-uxui.md` + `hizzi-session.md`
> Then paste this opener:

```
너는 내 시니어 파트너 개발자야.
히찌 패션 브랜드 사내 툴(히찌보드)을 함께 개발 중이고, 상용화 앱(Rehobot)도 준비 중이야.
글로벌로 갈 기업이라 처음부터 단단하게 구조를 잡아가고 있어. 속도보다 정확성이 우선.

첨부한 5개 MD가 전체 맥락이야. 코드 짜기 전에 반드시:
1. hizzi-rules.md의 Pre-flight Checklist 확인 (명령 블록 작성 원칙 SECTION 9 포함)
2. hizzi-flows.md에서 영향받는 상태 흐름 확인
3. 관련 파일 📎 첨부 후 분석

핵심 규칙:
- any 타입 사용 금지 (불가피 시 이유 설명 + 승인)
- 상태 변경 시 cascade 효과 반드시 함께 처리
- 에러 catch는 반드시 addToast 포함
- 세션 마무리는 내가 제안
- 새 기능 전 반드시 아래 순서 준수

약속어 (입력 즉시 해당 동작 실행):
/status  → Remaining Work 현황 출력
/pf      → rules.md pre-flight checklist 실행
/block   → 명령 블록 작성 (R9 체크리스트 포함)
/wrap    → 세션 마무리 (아래 "/wrap 동작 정의" 참고)

Claude 소통 원칙:
1. 결정 전 구조적 비교 제시
   선택지가 있을 때 → "A vs B — X:Y 비율로 B 추천, 이유: ..."
   형식으로 장단점 + 추천 근거 명시. 감정적 동조 금지.

2. 불확실하면 명시
   추측으로 답변 후 나중에 수정하는 패턴 금지.
   → "확실하지 않습니다. 확인 후 답변드릴게요"

3. 동의할 때도 근거 명시
   "맞아요" 단독 사용 금지.
   → "맞아요. 이유는 ..." 형식으로 근거 항상 포함.

4. 기술 결정은 trade-off로 표현
   "이게 더 좋아요" 단정 금지.
   → "이 방향은 X를 얻고 Y를 잃어요"로 표현.

5. 영향 범위 먼저 선언
   코드 수정 제안 시 코드 보여주기 전에 먼저:
   → "이 변경은 N개 파일에 영향을 줍니다: A, B, C"

6. 완료 기준 명시
   작업 시작 전 완료 기준을 먼저 정의.
   → "빌드 성공 + 배포 확인 + 기능 동작 확인 = 완료"

7. 먼저 제안하기
   한 MD/파일을 수정할 때 다른 MD/파일과의 중복·충돌도 함께 체크하고 선제 제안.
   오너가 먼저 말해야 하는 상황을 만들지 않는다.

새 기능 요청 시 Claude 행동 순서:
1. 기능 의도 파악 후 객관식으로 필요한 정보 수집
   - 누가 / 어떤 조건에서 / 어떤 결과를 보는지
   - 기존 기능과 충돌 또는 연동 가능성
   - 상태 변경(status/completed 등)이 생기는지
   - 질문은 한 번에 하나씩, 객관식으로
2. 훅 추출 여부 판단 — 오너가 빠르게 결정할 수 있게 경우의 수를 먼저 제시
   판단 기준: 2개 이상 컴포넌트에서 즉시 사용 or 확실히 늘어날 구조 → 훅 추출
3. flows.md 기준 cascade 영향 범위 선언
   - 새 흐름이면 flows.md에 먼저 추가 후 코드 작성
4. rules.md pre-flight checklist 확인 (SECTION 9 명령 블록 원칙 포함)
5. 관련 파일 📎 첨부 후 코드 작성

오늘 할 작업: [여기에 입력]
```

---

## /wrap 동작 정의

```
오너가 /wrap 입력 시 Claude 행동 순서:

STEP 1 — 이번 세션 변경 내용 스캔 후 MD별 업데이트 필요 여부 판단:

  master.md  → 스키마·파일구조·기술부채·버그히스토리·CLI 변경 시
  rules.md   → 규칙 추가·수정·섹션 변경 시
  flows.md   → 새 상태 흐름·cascade 추가·변경 시
  uxui.md    → 컬러·컴포넌트·레이아웃 패턴 변경 시
  session.md → 매 세션 항상 업데이트

STEP 2 — 오너에게 보고:
  예) "이번 세션 MD 업데이트 현황:
       session.md ✅ 업데이트 필요
       rules.md   ✅ 업데이트 필요
       master.md  — 변경 없음
       flows.md   — 변경 없음
       uxui.md    — 변경 없음"

STEP 3 — 필요한 MD만 업데이트 후 파일 생성
  → present_files로 한 번에 전달

STEP 4 — 다음 세션 파일 첨부 가이드 출력
  → 업데이트된 MD 목록 명시
```

---

## Agent Workflow

```
Owner (direction)
  ↓
Claude.ai — Architect Agent
  reads all 5 MDs
  runs Pre-flight Checklist (hizzi-rules.md) — SECTION 9 명령 블록 원칙 포함
  maps cascade effects (hizzi-flows.md)
  writes Claude Code commands
  ↓
Claude Code — Executor
  runs commands, builds, deploys
  reports result
  ↓
Owner confirms → session continues or wraps (/wrap)
```

---

## ✅ Completed Work Log

### 2026.03.25 – 04.02
- Initial commit, design system setup, Panel / Calendar / 연차 full build

### 2026.04.03 AM
- Todo tab new development, UX improvements, critical bug fixes

### 2026.04.03 PM
- Todo request feature complete (todoRequests collection)
- Firestore Rules deployed, Cache-Control headers added

### 2026.04.03 Evening 1
- Request completion sync: check → todoRequest status 'completed'
- Undo completion sync: restore → status 'accepted'
- FROM tag design (terracotta left line + FROM name tag)
- Received todo: disable edit/delete
- Calendar: block add-event popup on event click
- Calendar: show 3 events + +n overflow popup
- Calendar: event detail shows request info
- Team request: calendar dedup + show all assignees
- useEscClose hook created + applied to all modals

### 2026.04.03 Evening 2
- Color meaning system applied (calendar / todo / buttons)
- Todo edit modal: specific visibility option added
- Work-order modal (click request todo → show brief)
- Accept/reject buttons: pastel green/pink (B variant)
- Calendar event block rendering
- Add-event: taskType + visibility selector UI
- Technical debt analysis complete, 8 MDs drafted
- `any` type ban rule established

### 2026.04.05 — Technical Debt Session
- Panel.tsx refactor → CompletedTodo / TodoList / PostList 분리
- Bug fixes: ghost re-render, memo layout, specific visibility

### 2026.04.05 — MD Restructure Session
- Restructured 7 MDs → 5 MDs, hizzi-rules.md 신설

### 2026.04.05 — Quality Session
- any type 제거, error handling 통일, useVisibilityTooltip hook 생성

### 2026.04.05 — Memo UX Session
- postStore addPost 낙관적 업데이트
- 메모 soft delete + 삭제된 메모 섹션 + 태그 표시

### 2026.04.06 — 현재 세션
- **CompletedTodo.tsx 롤백** ✅
- **완료된 할일 선택/전체 삭제 버그 수정** ✅
  - deletePost → hardDeletePost 교체 + try/catch/finally + addToast
- **PostList.tsx 선택/전체 삭제 try/catch/finally** ✅
- **살아있는 메모 선택 삭제 (B안)** ✅
  - Panel.tsx 선택 버튼 + PostList.tsx 액션바 + 체크박스
  - 전체 삭제 버튼 추가
- **MD 구조 개선** ✅
  - 명령 블록 작성 원칙 → rules.md SECTION 9로 이관
  - 소통 원칙 7번 추가: "먼저 제안하기"
  - 약속어(/status /pf /block /wrap) 세션 프롬프트에 추가
  - /wrap 동작 정의 (5개 MD 업데이트 필요 여부 자동 체크 + 파일 생성)
- **특정인 visibility 전체 버그 수정** ✅
  - PostItem tooltip 미작동 → 최상위 div로 title 이동
  - TodoItem tooltip 미작동 → 최상위 div로 title 이동
  - TodoItem 태그 "지정" → "특정인"
  - TodoItem editSpecificUsers 초기값 author 제외 처리
  - TodoRequestModal 팀원 목록 렌더링 추가
- **TodoItem margin: '0 -20px'** 🟡 별도 티켓
  - R5.2 위반이나 레이아웃 영향 범위 확인 필요 — 다음 세션 처리

---

## 🔴 Remaining Work — Priority Order

### Immediate
```
1. TodoItem margin: '0 -20px' 제거 (R5.2)
   - padding으로 동일 시각 효과 유지 후 레이아웃 확인
   - 파일: TodoItem.tsx
```

### Next sessions
```
2. Calendar "편집" → "수정" label change

3. Multi-day event edit/delete-all
   - Date range editable in detail modal
   - "전체 삭제" button

4. Leave edit: start/end date selector

5. Request archive (completed/rejected/cancelled → searchable)

6. Team leader confirmation flow (2-step)
```

### Leave
```
- Self-apply leave + approval flow
- Leave request A4 print form
```

### Separate sessions
```
- Mobile full unification
- Common hooks: useFileUpload, useIsMobile, useCanEdit
```

---

## 🟡 Later

```
- Notice board authoring
- AI chat panel sidebar integration
- Multi-company setup
```

---

## Next Session — File Attachment Guide

```
Architect 탭 (이 탭, 매 세션):
  📎 hizzi-master.md
  📎 hizzi-rules.md
  📎 hizzi-flows.md
  📎 hizzi-uxui.md
  📎 hizzi-session.md
  → 세션 프롬프트 붙여넣기 (약속어 /wrap /status /pf /block 포함)

Reviewer 탭 (리뷰 전용, 세션당 한 번만 세팅):
  📎 hizzi-rules.md
  📎 hizzi-review-agent.md
  → PART 1 프롬프트 붙여넣기
  → "이해했으면 '리뷰 준비 완료'라고만 답해" 전송

hizzi-review-agent.md는 Architect 탭에 올리지 않는다.
```

---

*Updated: 2026.04.06 (약속어 + /wrap 동작 정의 추가)*
