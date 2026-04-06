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

약속어:
/status  → Remaining Work 현황 출력
/pf      → rules.md pre-flight checklist 실행
/block   → 명령 블록 작성 (R9 체크리스트 포함)
/wrap    → 세션 마무리

오늘 할 작업: [여기에 입력]
```

---

## /wrap 동작 정의

```
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

### 2026.04.06 — UX 설계 + 구현 세션
**UI 개선** ✅
- Panel 필터 바 (업무/요청/개인, 기본 업무+요청)
- 패널명 16px 단독 행 + 탭 우측 중앙정렬
- 태그 3분류 시스템 색상 확정
- 별 opacity 0.25→hover 0.6→starred 1.0
- 날짜 연도 포함 / 메모 작성자 제거
- 좌측 띠: 요청 #993556 / 업무 #C17B6B / 개인 #7B5EA7
- From {이름} 형식 / PostItem 별 버튼

**할일 아이템 구조 전면 개편** ✅
- 체크박스 맨 왼쪽, 별 그 다음
- 요청 할일 체크박스 즉시 완료 + cascade
- 클릭 레이어 (left:66px) 전체 클릭 팝업
- 휴지통 아이콘만 (border/background 없음, opacity 0.2→1.0)
- ··· 메뉴 완전 제거
- TEAM tooltip: createPortal + 3열 grid
- dueDate 시계 태그 (D-3 핑크, D-4+ terracotta)

**일반 할일 상세/수정 팝업** ✅
- 헤더 #5C1F1F / 제목 옆 연필 인라인 편집
- 상태바: 타입뱃지("할일") + 카테고리 + 공개범위
- 내용→기한→첨부→구분→범위 순서
- 구분/범위: div 태그 + 흐린 색상 비활성 패턴
- 푸터: 닫기+삭제(좌) / 저장(우)

**요청 할일 업무상세 팝업** ✅
- maxWidth 860px, 2단 레이아웃
- 헤더: 상태바 "할일" 뱃지 + From + 기한 시계
- 좌측 220px 고정 + 우측 채팅 flex:1
- 푸터: 닫기+삭제(좌) / 완료처리+저장(우)

**삭제된 할일 보기** ✅
- DeletedTodo.tsx 신규 생성
- 복구(completed:false 초기화) / 선택삭제 / 전체삭제
- TodoList !p.deleted 필터 추가

**팝업 UX 통일 설계 확정 + uxui.md Section 13-13 추가** ✅

---

## 🔴 Remaining Work — Priority Order

### Phase 2 — 팝업 기능 완성 (다음 세션)
```
🔴 일반 할일 팝업 — 기한 추가/수정 (+ 기한 추가 → date input)
🔴 일반 할일 팝업 — 첨부파일 추가/삭제 (Firebase Storage)
🔴 요청 할일 팝업 좌측 — 일반 할일과 동일 구성으로 교체 (수정 가능)
🔴 메모 팝업 — 동일 패턴 적용 (PostItem.tsx)
    파일: TodoItem.tsx, PostItem.tsx
```

### Phase 3 — 스키마 변경 + CreatePost 개편
```
🔴 Firestore posts: content → title+content 분리 + dueDate 전체 확장
🔴 CreatePost (+게시물) 팝업 통일 패턴 적용
🔴 캘린더 자동 등록 연동
    파일: CreatePost.tsx + postStore.ts + Calendar.tsx
```

### Phase 4 — 요청함 UX 재편
```
🔴 TodoRequestModal 탭 → 행동 기준 섹션 구조
🔴 댓글 기능 (todoRequests/{id}/comments)
🔴 완료 알림 토스트
    파일: TodoRequestModal.tsx + todoRequestStore.ts
```

### 기타
```
- Calendar "편집" → "수정"
- Multi-day event edit/delete-all
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

## 다음 세션 추천 시작 작업

```
1. 일반 할일 팝업 기한 추가/수정 (TodoItem.tsx)
2. 일반 할일 팝업 첨부파일 추가/삭제 (TodoItem.tsx)
3. 요청 할일 팝업 좌측 구성 교체 (TodoItem.tsx)
→ 셋 다 TodoItem.tsx 한 파일, 순서대로
```

---

## Next Session — File Attachment Guide

```
매 세션:
  📎 hizzi-master.md
  📎 hizzi-rules.md
  📎 hizzi-flows.md
  📎 hizzi-uxui.md
  📎 hizzi-session.md
  → 세션 프롬프트 붙여넣기
```

---

*Updated: 2026.04.06 (팝업 통일 설계 확정 + 할일 아이템 전면 개편 + DeletedTodo)*
