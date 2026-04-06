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
2. 불확실하면 명시
3. 동의할 때도 근거 명시
4. 기술 결정은 trade-off로 표현
5. 영향 범위 먼저 선언
6. 완료 기준 명시
7. 먼저 제안하기

오늘 할 작업: [여기에 입력]
```

---

## /wrap 동작 정의

```
오너가 /wrap 입력 시 Claude 행동 순서:
STEP 1 — 이번 세션 변경 내용 스캔 후 MD별 업데이트 필요 여부 판단
STEP 2 — 오너에게 보고
STEP 3 — 필요한 MD만 업데이트 후 파일 생성 (present_files로 한 번에)
STEP 4 — 다음 세션 파일 첨부 가이드 출력
```

---

## Agent Workflow

```
Owner → Claude.ai(Architect) → Claude Code(Executor) → Owner confirms
```

---

## ✅ Completed Work Log

### 2026.03.25 – 04.05
- Initial commit ~ MD 구조 확립 / Panel 리팩터 / 메모 UX / any 제거 / error handling 통일

### 2026.04.06 — UX 설계 세션 1차
- **UI 개선** ✅
  - Panel 필터 바 추가 (업무/요청/개인, 기본 업무+요청)
  - 패널명 16px 단독 행 + 탭 우측 중앙정렬 (편지봉투|할일|메모)
  - 태그 3분류 시스템 (카테고리 바탕+테두리 / 공개범위 테두리만 / From·TEAM 바탕만)
  - "특정인" → "특정" 전체 통일
  - 별 opacity 0.25 → hover 0.6 → starred 1.0
  - 날짜 연도 포함 + 맨 우측 정렬 / 메모 작성자 제거
  - 좌측 띠: 요청 #993556 / 업무 #C17B6B / 개인 #7B5EA7
  - From {이름} 형식 / PostItem 별 버튼 + handleStar addToast
- **MD 개선** ✅
  - uxui.md Section 13 UX 원칙 전체 확정 (13-1 ~ 13-11)
  - uxui.md 태그 3분류 시스템 색상 확정

### 2026.04.06 — UX 설계 세션 2차
- **UX 설계 확정** ✅
  - 업무상세 팝업 2단 레이아웃 (좌: 요청정보+첨부파일 / 우: 댓글 스크롤)
  - 헤더: 제목 17px + 등록일·기한 나란히
  - 댓글: 고정 높이 220px + overflow-y auto
  - 첨부파일: 팝업 내 추가/삭제
  - 완료처리: 체크박스(패널) + 블락버튼(팝업) 둘 다
  - 요청 할일 체크박스: 즉시 완료 (팝업 없이)
  - 보이는 범위 색상: 패널 태그와 동일 (전체 초록/나만 파랑/특정 앰버)
- **설계만 완료, 미구현** 🔴
  - 댓글 기능 (Firestore 서브컬렉션 필요 — flows.md 업데이트 선행)
  - 첨부파일 팝업 내 추가/삭제
  - 게시물 생성 UI 제목+내용 분리 (Phase 3 스키마 변경 선행)
  - 요청 할일 체크박스 즉시 완료 변경

---

## 🔴 Remaining Work — Priority Order

### Phase 1 — 완료 ✅
```
패널명 단독 행 + 필터 바 + 탭 우측 정렬
```

### Phase 2 — 할일 아이템 구조 (일부 완료)
```
✅ 태그 3분류 / 별 opacity / 날짜 / 띠 색상
🔴 요청 할일 체크박스 즉시 완료 변경
    - post.requestId 있어도 handleCheck 즉시 실행
    - 제목 클릭 → 팝업 유지 (완료 버튼만 제거)
    파일: TodoItem.tsx

🔴 업무상세 팝업 2단 레이아웃 + 댓글 + 첨부파일
    - 좌: 요청 내용 + 공개/구분 태그 + 첨부파일
    - 우: 댓글 (220px 고정 + 스크롤)
    - 푸터: 완료처리 블락 버튼
    - Firestore: todoRequests/{id}/comments 서브컬렉션
    파일: TodoItem.tsx + todoRequestStore.ts + flows.md
```

### Phase 3 — 할일 제목+내용 구조 (별도 세션)
```
🔴 Firestore posts 스키마: content → title + content 분리 + dueDate
🔴 CreatePost 할일 생성 UI: 제목+내용+기한 + 보이는범위 색상 통일
🔴 게시물 생성 보이는 범위 색상: 전체(초록)/나만(파랑)/특정(앰버) — 패널과 통일
🔴 기한 있는 할일 → 캘린더 자동 등록 연동
    파일: CreatePost.tsx + postStore.ts + Calendar.tsx + flows.md
```

### Phase 4 — 요청함 UX 재편 (별도 세션)
```
🔴 TodoRequestModal 탭 → 행동 기준 섹션 구조
    섹션: 내가 수락해야 함 / 내가 진행 중 / 상대방 대기 중 / 완료(접힘)
🔴 완료 알림 토스트 (요청자에게)
    파일: TodoRequestModal.tsx + todoRequestStore.ts + toastStore.ts
```

### 기타
```
- TodoItem margin: '0 -20px' 제거 (R5.2)
- Calendar "편집" → "수정"
- Multi-day event edit/delete-all
- Leave edit: start/end date selector
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

## Next Session 추천 시작 작업

```
1. 요청 할일 체크박스 즉시 완료 (TodoItem.tsx — 작은 변경)
2. 업무상세 팝업 2단 레이아웃 (TodoItem.tsx — 중간 변경)
3. 댓글 Firestore 설계 (flows.md 업데이트 후 구현)
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
```

---

*Updated: 2026.04.06 (UX 설계 세션 2차 — 업무상세 팝업 2단 레이아웃 + 댓글 + 첨부파일 설계 확정)*
