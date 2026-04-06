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
2. 훅 추출 여부 판단
3. flows.md 기준 cascade 영향 범위 선언
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
  uxui.md    → 컬러·컴포넌트·UX원칙·레이아웃 패턴 변경 시
  session.md → 매 세션 항상 업데이트

STEP 2 — 오너에게 보고
STEP 3 — 필요한 MD만 업데이트 후 파일 생성 (present_files로 한 번에)
STEP 4 — 다음 세션 파일 첨부 가이드 출력
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
- Request completion sync / undo sync / FROM tag / work-order modal
- Calendar: click guard / overflow popup / event detail / team dedup
- useEscClose hook

### 2026.04.03 Evening 2
- Color meaning system / visibility options / accept/reject buttons
- Calendar event block rendering / add-event UI
- `any` type ban rule established

### 2026.04.05 — Technical Debt Session
- Panel.tsx refactor → CompletedTodo / TodoList / PostList 분리

### 2026.04.05 — MD Restructure + Quality + Memo UX Session
- 5개 MD 구조 확립 / any 제거 / error handling 통일
- postStore 낙관적 업데이트 / soft delete / 삭제된 메모 섹션 / 태그 표시

### 2026.04.06 — 현재 세션
- **버그 수정** ✅
  - CompletedTodo 선택/전체 삭제: deletePost → hardDeletePost + try/catch/finally
  - PostList 선택/전체 삭제: try/catch/finally + addToast
  - 특정인 tooltip 전체 수정 (PostItem/TodoItem — 브라우저 title → 커스텀)
  - TodoItem 태그 "지정" → "특정인"
  - TodoItem editSpecificUsers 초기값 author 제외
  - TodoRequestModal 팀원 목록 렌더링 추가
  - 팝업 내 공개범위 "지정" → "특정인"
- **신규 기능** ✅
  - 살아있는 메모 선택 삭제 B안 (Panel 선택버튼 + PostList 액션바 + 전체삭제)
  - 메모 즐겨찾기 (starred 토글 + 상단 정렬)
  - 팀 요청 할일 TEAM tooltip 커스텀 (가로 칩, 3명 1행)
  - 팀 요청 할일 전체 클릭 → 팝업 오픈 + "상세 보기 ›" B안
  - 할일/메모 태그 스타일 통일 (배경 없음 + 테두리만)
- **MD 개선** ✅
  - rules.md SECTION 9 신설 (명령 블록 원칙 이관)
  - session.md 약속어(/wrap /status /pf /block) + /wrap 동작 정의
  - uxui.md SECTION 13 UX 원칙 신설 (9개 원칙 확정)
  - uxui.md SECTION 13-9 요청함 UX (행동 기준 섹션 구조)
  - uxui.md SECTION 13-10 완료 알림 원칙 (토스트 + 배지 C안)
- **TodoItem margin: '0 -20px'** 🟡 별도 티켓 (R5.2 위반, 레이아웃 확인 필요)

---

## 🔴 Remaining Work — Priority Order

### Phase 1 — 패널 레이아웃 + 필터 바 (다음 우선)
```
1. 패널명 → 탭바 인라인 이동
   - 탭바 좌측 패널명, 우측 탭 버튼
   - 파일: Panel.tsx

2. 필터 바 추가 (업무 / 요청 / 개인)
   - 기본 선택: 업무+요청 동시 / 중복 선택 허용
   - 메모 탭에서 숨김
   - 파일: Panel.tsx · TodoList.tsx

3. + 게시물 버튼 → 필터 바 우측으로 이동
   - 파일: Panel.tsx
```

### Phase 2 — 할일 아이템 구조 개선
```
4. 아이템 레이아웃: 체크박스 → 별 → 제목 → 쓰레기통
   내용 2줄 미리보기 항상 표시
   파일: TodoItem.tsx

5. 쓰레기통 삭제 버튼 (hover 시 표시, 0.3s 딜레이 soft delete)
   파일: TodoItem.tsx

6. 정렬: 즐겨찾기 → 기한임박 → 최신순
   파일: TodoList.tsx
```

### Phase 3 — 할일 제목+내용+기한 구조 (대형, 별도 세션)
```
7. Firestore posts 스키마: content → title 분리 + content 신규 + dueDate 전체 확장
   마이그레이션 스크립트 필요 / flows.md 업데이트 선행

8. CreatePost 할일 생성 UI: 제목+내용+기한 선택기
   파일: CreatePost.tsx

9. 할일 수정 모달: 제목+내용+기한 편집
   파일: TodoItem.tsx

10. 기한 있는 할일 → 캘린더 자동 등록 연동
    파일: postStore.ts · Calendar.tsx · flows.md
```

### Phase 4 — 요청함 UX 재편 (별도 세션)
```
11. TodoRequestModal 탭 구조 → 행동 기준 섹션 구조로 전면 개편
    섹션: 내가 수락해야 함 / 내가 진행 중 / 상대방 대기 중 / 완료(접힘)
    파일: TodoRequestModal.tsx

12. 완료 알림 토스트 (요청자에게)
    todoRequests onSnapshot에서 status 변경 감지 → addToast
    파일: todoRequestStore.ts · toastStore.ts
```

### 기타
```
- TodoItem margin: '0 -20px' 제거 (R5.2) — 레이아웃 확인 필요
- Calendar "편집" → "수정" label change
- Multi-day event edit/delete-all
- Leave edit: start/end date selector
- Request archive searchable
- Mobile full unification
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
  → 세션 프롬프트 붙여넣기

Reviewer 탭 (리뷰 전용):
  📎 hizzi-rules.md
  📎 hizzi-review-agent.md
```

---

*Updated: 2026.04.06 (UX 설계 세션 — 요청함/완료알림/필터/아이템구조 확정)*
