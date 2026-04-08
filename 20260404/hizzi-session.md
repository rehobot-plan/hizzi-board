# 히찌보드 — 세션 로그

---

## 새 세션 시작 방법

**1단계: 아래 7개 파일 첨부**
```
hizzi-master.md         — 프로젝트 전체 현황
hizzi-rules.md          — 코딩 규칙 & 체크리스트
hizzi-flows.md          — 상태 흐름 맵
hizzi-uxui.md           — 디자인 토큰 (색상/타이포)
hizzi-patterns.md       — UI 패턴 (모달/hover/팝업 구현)
hizzi-ux-principles.md  — UX 원칙 (설계 결정 기준)
hizzi-session.md        — 세션 로그 & 운영 방식
```

**2단계: 아래 프롬프트 붙여넣기**

```
너는 이 분야 최고 수준의 전문가이자 나의 수석 개발자야.
히찌보드(패션 브랜드 사내 툴) + Rehobot(상용화 앱) 개발 중.
글로벌 상용화 목표. 속도보다 정확성 우선.

[실행 원칙]
제안 → 대기 → 승인("해줘"/"ok") → 실행. 이 순서 절대 변경 금지.

[역할]
결정: 오너 / 실행: Claude
제공: 근거+장단점 / 금지: 설득, 임의 결정, 임의 실행

[오너 특성]
- 구조 변경 필요 시 → 기능 전에 먼저 보고
- 근거+장단점 없으면 → 제안 아님
- 동일 실수 2회 → 코드 수정 전 구조적 원인 보고
- 오너 결정 후 → 즉시 실행, 재검토 없음

[분석]
- 추측 금지 → 파일 직접 열어 확인 후 진행
- 영향 범위 → 작업 전 전체 파악, 누락 시 보고
- 리스크 발견 → 즉시 중단 + 보고

[소통]
- 답변: 결론 먼저
- 불가 → 명확히 + 대안 제시
- 반대 의견 → 정중하되 명확하게
- 요청/제안 → 한 문장으로 끝냄
- Claude가 확인 가능한 것 → 오너에게 묻지 않음
- 제안 시 해결 확률 + 근거 + 잔여 리스크 함께 표기

[코드]
- 작업 전: rules.md 마스터 체크리스트 실행
- 블록: 수정+build+commit+deploy 한 번에 완결
- 범위: 필요한 것만 / 커지면 먼저 보고
- 더 나은 방법 → 먼저 제안, 오너 판단
- any 금지 / cascade 필수 / catch→addToast / 교체방식 R4.5
- .next 삭제: 타입/환경변수/store 구조 변경 시만 / 컴포넌트 변경은 생략

[MD]
- 작업 관련 MD 집중 읽기
- 충돌 발견 → 즉시 보고, 충돌 상태 진행 금지

[세션]
- 마무리: 오너가 제안
- 방향 이탈 감지 → 즉시 알림

[배포 후]
수정 기능 동작 확인 / side effect 확인 / 콘솔 에러 없음

[에러 보고]
어디서(파일+라인) / 무엇이(요약) / 왜(원인) / 해결(1순위+대안)

[설명]
기술 용어 → 한 줄 부연 / 왜→어떻게 순서 / 재질문 없는 수준으로

[컨텍스트]
확정 내용과 방향 다를 때 / 같은 질문 반복될 때
→ "컨텍스트 재확인이 필요합니다" 보고

약속어:
/status  → Remaining Work 출력
/pf      → 마스터 체크리스트 실행
/block   → 명령 블록 작성
/review  → 현재 블록을 리뷰방 제출용으로 정리 (체크 그룹 명시 포함)
/md      → MD 7개 최신화 + 전달

첨부한 7개 MD가 전체 맥락이야. 오늘 할 작업: [여기에 입력]
```

---

## 3단계 운영 구조

```
1단계 — 설계방 (이 창)
  7개 MD 첨부 + 세션 프롬프트로 시작
  설계 · 제안 · MD 업데이트
  /block으로 명령 블록 생성

2단계 — 리뷰방 (별도 창)
  첨부: hizzi-rules.md + hizzi-review-session.md + 검토할 코드 파일
  프롬프트: "아래 파일을 hizzi-rules.md 기준으로 리뷰해줘.
             체크 그룹: [A/B/C/D/E/F] 결과를 hizzi-review-session.md 형식으로 정리해줘."
  PASS/FAIL 기록 → hizzi-review-session.md 업데이트

3단계 — Claude Code
  리뷰 PASS한 블록만 실행
  build + commit + deploy
```

### 리뷰 체크 그룹 기준
```
A — visibleTo (공개범위)
B — 상태 전환 & cascade
C — Firestore 저장 안전
D — TypeScript 타입
E — UI & 모달 패턴
F — 에러 처리
```

---

## MD 파일 역할 & 단일 책임

| 파일 | 역할 | 수정 시점 |
|------|------|-----------|
| hizzi-master.md | 프로젝트 현황, 기술 스택, 파일 구조, 로드맵 | 구조 변경 시 |
| hizzi-rules.md | 코딩 규칙, 마스터 체크리스트, 명령 블록 원칙 | 규칙 추가/변경 시 |
| hizzi-flows.md | 상태 전환, 연쇄 업데이트 규칙 | 새 상태 흐름 추가 시 |
| hizzi-uxui.md | 색상 토큰, 타이포, 색상 의미 시스템 | 디자인 수치 변경 시 |
| hizzi-patterns.md | UI 구현 패턴 (모달, hover, 팝업 코드) | 새 패턴 확정 시 |
| hizzi-ux-principles.md | UX 결정 원칙 (왜 이렇게 했는가) | UX 원칙 변경 시 |
| hizzi-session.md | 세션 운영, 작업 이력, Remaining Work | 매 세션 마무리 시 |

> 규칙: 각 MD는 단일 책임을 가진다. 같은 내용이 두 파일에 있으면 충돌 원인이 된다.
> 파일 크기 기준: 500줄 이하 유지.

---

## Agent Workflow

```
Owner(방향 결정) → Claude.ai(제안·설계·실행) → Claude Code(코드 적용) → Owner(확인)

명령 블록 실행 원칙:
- 빌드 에러 발생 시만 중단 + 보고
- 정상 빌드면 commit + deploy 자동 진행
- 한 블록 = 파일수정 + build + commit + deploy + 확인항목 완결
- .next 삭제: 타입/환경변수/store 구조 변경 시만 포함
- 파일 교체 방식: rules.md R4.5 기준만 따른다
```

---

## 작업 이력

### 2026.03.25 – 04.05
Initial commit ~ MD 구조 확립 / Panel 리팩터 / 메모 UX / any 제거 / error handling 통일

### 2026.04.06 오전 — UX 설계 + 구현
Panel 필터 바 / 패널명 / 태그 3분류 / 별 opacity / 좌측 띠 / 할일 아이템 구조 전면 개편
일반 할일 상세/수정 팝업 / 요청 할일 업무상세 팝업 / 팝업 UX 통일 설계 확정

### 2026.04.06 오후 — CreatePost/PostItem/TodoList 개편
CreatePost 3탭 재설계 / 할일 title/content 분리 / dueDate 필드 추가
기한 yyyymmdd + 달력 아이콘 / 캘린더 등록 체크박스 / 요청 범위 3종
TodoList 필터링·정렬 수정 / 삭제된 메모 복구 버튼

### 2026.04.07 — TodoItem / CreatePost / MD 정비
TodoItem: 일반 할일 팝업 기한+캘린더 / 요청 할일 삭제 버튼 (cascade) / any 타입 제거
MD 전면 재작업 / 3파일 분리 / 단일 책임 구조 확립

### 2026.04.08 — 팝업 통일 + 버그 수정 + 인코딩 복원
PostItem: P8 키-값 테이블형 팝업 완성 / editContent 버그 / 첨부파일 전체 정비
TodoItem: P8 키-값 테이블형 팝업 완성 / dueDate 형식 / 이미지 제목 / 캘린더 중복 확인
page.tsx: 한글 인코딩 전면 복원
users: Firestore 6명 + 관리자 재삽입

---

## Remaining Work

### Phase 2 — 파일 분리 (최우선)
```
1. PostItem.tsx → PostEditModal.tsx 분리
2. TodoItem.tsx → TodoEditModal.tsx 분리
   분리 후 각 파일 300줄 이하 목표
   세션 시작 전 PostItem.tsx + TodoItem.tsx 첨부 필요
```

### Phase 2 — 첨부파일 다중 업로드
```
3. post.attachment → post.attachments 배열 스키마 확장
   하위 호환: 기존 단일 attachment 처리 유지
   버튼: 저장(download) / 추가 / 삭제
   링크 타입: 저장 버튼 → 새탭 열기
   영향 파일: postStore.ts / Post 타입 / TodoItem / PostItem / CreatePost
   세션 시작 전 postStore.ts + Post 타입 파일 첨부 필요
```

### Phase 3 — 요청함 UX 재편
```
4. TodoRequestModal 섹션 구조 재편
5. 댓글 기능 (todoRequests/{id}/comments)
6. 완료 알림 토스트
```

### 기타 버그
```
- Calendar "편집" → "수정"
- 특정인 hover tooltip 미작동 버그
- 멀티데이 이벤트 수정/전체삭제
- leaveViewPermission 사용자별 재설정 필요 (users 재삽입으로 'none' 초기화됨)
```

---

*Updated: 2026.04.08 (P8 팝업 통일 완료 / 인코딩 복원 / users 재삽입 / .next 삭제 기준 명시 / 해결 확률 표기 추가)*
