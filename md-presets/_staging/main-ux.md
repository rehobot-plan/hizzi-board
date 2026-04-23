# 메인 페이지 UX 정비 — 설계 문서

> 직원 시범 배포 게이트. 메인(`/` 홈) 화면의 UX 품질이 배포 성패를 결정한다.
> 모바일 1인 뷰 = 데스크탑 패널 미니 프리뷰라는 프레이밍을 모든 결정의 기반으로 삼는다.
> 각 섹션은 독립 PASS 기준을 갖고, 구현 블록은 §1 → §5 순차 실행.

---

## 0. 프레이밍 — 모바일 1인 뷰 = 데스크탑 패널 미니 프리뷰

히찌보드 메인의 6패널 그리드는 데스크탑 전용 레이아웃이 아니다. 각 패널은 **한 사람의 모바일 뷰를 데스크탑에서 미니 프리뷰로 보여주는 구조**다. 모바일에서 사용자는 자기 패널 하나가 viewport 전체를 차지한 상태로 앱을 쓰고, 데스크탑에선 자기 패널을 포함해 6패널을 한 번에 본다. 같은 컴포넌트가 두 컨텍스트에서 쓰이는 게 아니라, 설계가 "내 모바일 화면이 데스크탑에서 어떻게 축소돼 다른 사람과 나란히 보이는가" 관점에서 출발한다.

이 프레이밍이 본 문서 §1~§5 모든 결정의 배후 기준:
- 패널 높이는 모바일 폰 아스펙트와 일관되게 (§1)
- 터치 타겟·스와이프 등 모바일-native 상호작용을 우선 설계 후 데스크탑에서 동일 동선 매핑 (§2)
- 봉투·FAB 등 개인 도구는 패널 내부에 둬서 "내 자리" 개념 유지 (§3·§4)
- 달력도 같은 패널 안 피어 뷰로 통합 (§5)

**범위 밖:** 후순위 #4 자연어 빠른 추가 / 후순위 #5 알림 센터 / 후순위 #6 요청 타임라인. 본 정비는 이들의 진입점·기반만 마련한다.

---

## 1. 패널 높이 제어

### 1.1. 결정

패널 컨테이너에 `max-height: min(600px, 70vh)` 제약, 내부 스크롤로 전환.

600px는 iPhone 13/14(844pt), Galaxy S23(851pt) 등 주요 모바일 viewport 높이 구간의 중위값. 데스크탑에서 패널이 이 범위로 capped되면 "이 패널이 내 폰에서 어떤 비율로 보이는지"를 시각으로 즉시 가늠할 수 있다. 4K 모니터에서도 동일 높이 유지되어 "모바일 프리뷰" 일관성 확보.

`70vh` 상한은 1366×768 저해상도 노트북(538px) 환경에서 600px 상한이 비효율적으로 작동하지 않게 만드는 안전망. 최종 값은 `min(600px, 70vh)` — 둘 중 작은 값으로 수렴.

`min-height`는 240px로 설정 (탭바 44 + 필터/월네비 바 36 + 최소 콘텐츠 영역 160). 빈 패널이 접혀 다른 패널과 높이 불일치가 나지 않게 보장.

### 1.2. 내부 스크롤 UX

- 스크롤 영역은 아이템 리스트(탭바·필터/월네비 바·하단 회수 링크 영역 제외)
- 스크롤바: 4px 폭 커스텀 (`text-hint #C4B8B0`), ZARA/COS 미니멀 톤 유지
- 하단 fade-out: 8~12px, `main-bg #FDF8F4`에서 투명으로 — 추가 콘텐츠 존재 시사
- 할일·메모 탭은 각각 독립 스크롤 위치 기억 (탭 전환 후 복귀 시 유지)
- 달력 탭은 별도 처리 (§5, 월 그리드 특성상 스크롤 대신 월 네비로 이동)

### 1.2a. ⋯ 펼쳐보기 handle

패널 하단 경계에 handle pill을 배치해 스크롤 대안으로 전체 내용을 펼쳐볼 수 있게 한다. 시각 토큰(크기 44×18 · chevron 14px · #C4B8B0 → hover #9E8880 · bottom -9 · z-index 3 등)은 uxui.md §4 handle 토큰 단일 출처.

**2단 wrapper 구조 필수.**
세션 #60 핫픽스 "큰 게시물 옆 패널 덮음" 방어로 Panel.tsx에 `overflow: hidden`이 걸려 있다. handle이 Panel 내부에 있으면 이 overflow에 잘려 border 걸침이 보존되지 않는다. 외부 relative wrapper(overflow visible) + 내부 card(overflow hidden) 분리 구조로 handle은 card 경계에 걸치되 바깥 wrapper에 의해 렌더된다. P8 패턴 참조.

**scroll 구조 — flex 아이템 min-height: 0 필수.**
card 내부 scroll div에 `flex: 1 1 auto` + `min-height: 0` + `overflow-y: auto` 필수. min-height: 0 누락 시 flex 아이템이 content 이하로 축소되지 못해 scrollHeight === clientHeight 폴백 → hasOverflow 항상 false로 판정, handle 노출 실패. 세션 #54~#61 잠복했던 구조 버그의 실측 근본 원인.

**hasOverflow 감지.**
ResizeObserver + MutationObserver(characterData 제외) + rAF 배치 + 이전값 guard 조합. `scrollHeight > clientHeight` 조건으로 표시. 빈 패널·적은 아이템 패널엔 비노출. posts/todos 변경 시 재측정.

**접힘 복귀.**
isExpanded → false 전환 시 scrollTop 0 재설정.

### 1.2b. 능동 scroll 정렬

원칙은 ux-principles.md U13. 본 섹션은 ⋯ 펼쳐보기 handle 맥락의 구체 구현 조건.

펼침·접힘 시 패널 상단이 viewport scroll-margin-top 80px에 정렬되도록 능동 scroll 실행:

- 실행: `scrollIntoView({ block: 'start', behavior })`
- 레이아웃 안정 대기: rAF 2프레임
- 중복 실행 방지: isScrollingRef 플래그 + 400ms lock
- 데스크탑 한정: `window.innerWidth >= 768`
- 이미 가시 생략: 패널 top이 `0 <= top <= 100` 범위면 skip (100px 임계)
- reduced-motion 폴백: `window.matchMedia('(prefers-reduced-motion: reduce)').matches` 시 `behavior: 'instant'`, 그 외 `'smooth'`
- Rollback: `localStorage.getItem('hizzi:activeScrollDisabled') === 'true'` 시 능동 scroll 전체 비활성 (UI 노출 없음, DevTools console에서만 설정, 코드 주석으로 해제 방법 명시)

수치 토큰은 uxui.md §4 능동 scroll 토큰 참조.

### 1.2c. 다층 방어 5층

원인 미규명 scroll jump 대응. 세션 #61 Playwright mouse.move/down/up 분리 시퀀스 실측 결과 production에서 scrollY 유지(jump=0)·가상 mouse 재현 실패 → 실 Chrome 특이 동작 가능성. scroll-behavior: smooth 상속 가설 기각.

능동 scroll 정렬(§1.2b)로 덮어쓰는 접근 전환 후에도 기존 방어는 최종선으로 유지. 원인 규명 전까지 누적 (U13 "방어 구조 제거 금지"):

1. **overflow-anchor: none** — globals.css html·body + Panel card style. DOM 변화 시 viewport anchor 보존 기본 동작 전역 off.
2. **handle onMouseDown preventDefault** — 클릭 시 focus 이동 차단. 키보드 Tab 접근은 유지(mousedown만 차단).
3. **intentScrollYRef** — hover/focus/touch 진입 시점(jump 이전) scrollY 선기록. click 발생 시 이 값을 복원 기준으로 사용.
4. **400ms 감시 창 scroll intercept** — click 이후 400ms 동안 scroll event 감지마다 즉시 복원. rAF 2회 직접 복원 동반.
5. **scrollTo instant + globals.css scroll-behavior: auto** — `scrollTo({ behavior: 'instant' })` 명시. globals.css에도 `scroll-behavior: auto` 명시로 상속 가능성 차단.

### 1.3. 독립 PASS 기준

- [ ] 6패널 모두 `min(600px, 70vh)` 적용
- [ ] 할일 30개+ 상황에서 패널 내부 스크롤 동작, 페이지 스크롤은 패널 간 이동에만 사용
- [ ] 빈 패널이 240px min-height 유지
- [ ] 하단 fade-out이 스크롤 끝 도달 시 사라짐
- [ ] 할일·메모 탭 간 전환 시 스크롤 위치 기억
- [ ] ⋯ handle 노출 ↔ scroll overflow **1:1 엄격 일치** (scrollHeight > clientHeight). `sh >= ch` 같은 자명 부등식 assertion 금지(회귀 감지 실패 이력, MEMORY #61-a)
- [ ] 2단 wrapper 구조 유지, scroll div `flex: 1 1 auto` + `min-height: 0` 확인
- [ ] 능동 scroll 정렬 작동 — 펼침 시 패널 상단이 scroll-margin-top 80px 위치로 이동, 이미 가시 범위(0~100px) 생략, reduced-motion 시 instant 폴백
- [ ] 다층 방어 5층 코드 잔존 확인 (U13 "방어 구조 제거 금지")
- [ ] Playwright E2E에서 page.click() 대신 element.click() programmatic 또는 mouse.move/down/up 분리 시퀀스 사용 (actionability scroll baseline 오염 회피, MEMORY #61-b)

### 1.4. 영향 파일

- `src/components/Panel.tsx`
- `src/components/TodoList.tsx` · `PostList.tsx`
- `src/styles/tokens.ts` (스크롤바·fade-out 토큰 추가)

---

## 2. 완료·삭제 UX — 대칭 설계

### 2.1. 결정 — 대칭 회수 동선

완료 축과 삭제 축이 같은 3층 회수 구조를 공유한다:

```
활성 할일 리스트
  ├─ 체크 (완료) → 최근 완료 N개 (24시간) → 지난 완료 (영구 보관)
  └─ 스와이프 (삭제) → 최근 삭제 N개 (24시간) → 휴지통 (30일 후 hard delete)
```

리스트 하단에 "최근 완료 N개 →" / "최근 삭제 N개 →" 두 링크가 병행 노출. 탭바 우상단 메뉴(···) 안 "기록" 항목이 완료·휴지통 2탭 모달로 진입.

### 2.2. 상호작용 설계

**체크 (완료):**
- 체크박스 시각 18px, 터치 영역 44px (행 전체 높이를 터치 영역으로 확장)
- 0.6s 애니메이션 후 완료 처리 (기존 U7 유지)
- cascade: `posts.completed = true` + `todoRequests.status = 'completed'` (기존 U7 유지)

**스와이프 (삭제):**
- 좌←우 드래그로 삭제 영역 노출 → 아이템 우측에 "삭제" 라벨 출현 → 놓으면 실행
- 데스크탑: 트랙패드 드래그·마우스 클릭-드래그 동일 동작
- 기존 hover 휴지통 아이콘 **완전 제거**
- soft delete (`deleted: true` + `deletedAt` 타임스탬프), 즉시 리스트에서 제거

**스와이프 방향:**
- 좌←우 = 삭제 (분홍 궤적)
- 우→좌 = 본 범위에선 미할당. 향후 완료 제스처 확장 여지로 비워둠

### 2.3. 3층 복구 구조

**1층 — 즉시 복구 (토스트 5초):**
- 삭제/완료 직후 하단 토스트 "삭제됨 · 실행 취소" / "완료됨 · 되돌리기"
- 5초 내 탭하면 이전 상태로 복귀
- 요청 할일 cascade 실수 방어 1차 방어선

**2층 — 최근 회수 (리스트 하단 링크, 24시간 창):**
- "최근 완료 3개 →" / "최근 삭제 2개 →" 하단 배치
- 24시간 이내 완료/삭제된 항목 집계 자동 노출
- 0건이면 숨김 (no content → no chrome)
- 탭하면 해당 섹션 모달 열림, 개별 복원 가능

**3층 — 장기 회수 (탭바 메뉴 → "기록"):**
- 탭바 우상단 메뉴(···) 안 "기록" 항목
- 진입 시 2탭 모달: [완료] / [휴지통]
- 완료 탭: 24시간 지난 완료 항목, 영구 보관
- 휴지통 탭: 24시간 지난 삭제 항목, 30일 후 hard delete

### 2.4. 요청 할일 cascade 방어

요청 할일 스와이프 삭제 시:
- `post soft delete` + `todoRequest.status = 'cancelled'` (flows.md FLOW 1 유지)
- 1층 토스트 "실행 취소" 탭 시 양쪽 동시 복구
- 2층·3층 복구 시에도 `todoRequest.status`를 삭제 직전 상태(`pending` 또는 `accepted`)로 cascade 복귀

상대방이 대기 중인 요청을 실수 삭제할 위험 → 1층 토스트 5초가 주 방어선. 이후는 2층·3층에서 복구 후 상태 재동기화.

### 2.5. 기존 `CompletedTodo.tsx` 재편

현재 완료된 할일이 별도 섹션에 지속 표시되는 구조 → **2층 구조로 재편**:
- 패널 메인 리스트에는 활성 할일만 표시
- 24시간 창 내 완료 항목은 하단 "최근 완료 N개 →" 링크로만 접근
- 24시간 경과분은 탭바 메뉴 "기록 → 완료" 탭으로 이관

이 재편이 §1 문제(패널 과확장)의 원인 제거에 직결된다. 현재 구조는 활성 할일이 완료 항목 속에 시각적으로 묻히고 패널이 세로로 계속 늘어나는 주된 원인.

### 2.6. 독립 PASS 기준

- [ ] 체크박스 터치 영역 44px 보장 (시각 18px 유지)
- [ ] 스와이프 삭제 동작 (모바일 터치 + 데스크탑 트랙패드/마우스 공통)
- [ ] hover 기반 휴지통 아이콘 코드 전부 제거
- [ ] 토스트 5초 실행 취소 완료/삭제 양측 작동
- [ ] 하단 "최근 완료/삭제 N개 →" 링크 24시간 창 자동 계산, 0건 시 숨김
- [ ] 탭바 메뉴 "기록" 모달 2탭 동작, 개별 복원 가능
- [ ] 요청 할일 cascade 복구 테스트 PASS (1층·2층·3층 각각)
- [ ] `CompletedTodo.tsx` 재편, 기존 하단 완료 섹션 제거

### 2.7. 영향 파일

- `src/components/TodoItem.tsx` · `PostItem.tsx`
- `src/components/CompletedTodo.tsx` (전면 재편)
- `src/components/Panel.tsx` (하단 회수 링크·메뉴 추가)
- `src/store/postStore.ts` (스와이프 처리, 24h 창 쿼리, deletedAt 관리)
- `src/store/toastStore.ts` (완료/삭제 실행 취소 토스트 통합)
- 신규: `src/components/RecordModal.tsx` (2탭 모달)
- flows.md FLOW 1 (요청 cascade 복구 경로 추가)

---

## 3. 요청 봉투 & 완료 알림

### 3.1. 결정

위치 **per-panel 유지** (현재 구조 그대로). 글로벌 헤더 이동은 철회. 모바일에선 자기 패널이 viewport 전체이므로 봉투가 탭바 안에 있으면 mobile-native 위치. 데스크탑에선 본인 패널에만 봉투 아이콘 노출, 다른 사용자 패널에선 비어있음 (개인 mailbox 경계 시각화).

### 3.2. 완료 알림(U10) 이 범위에서 구현

현재 U10은 ux-principles.md에 🔲 미구현으로 표시. 후순위 #5 알림 센터 이관 고려했으나 기획 일괄 마무리 방침에 따라 본 범위에서 해결:

- 배지 카운트 확장: `pending` 건수 + 미확인 완료 알림 건수 합산
- 완료 알림 조건: 내가 보낸 요청이 `completed`로 전환 (`pending|accepted` 어느 단계에서든 — 체크박스 즉시 완료 경로 포함)
- 봉투 탭 시 열리는 `TodoRequestModal` 섹션 4 "완료·반려·취소"가 그릇 역할
- 새 완료 알림이 있는 항목만 시각 강조 (미확인 표시), 모달 오픈 시 `seenAt` 타임스탬프 업데이트 후 강조 제거

배지는 "내가 액션해야 할 것 + 내가 궁금해할 만한 것" 두 축 합산.

### 3.3. 독립 PASS 기준

- [ ] 봉투 per-panel 위치 유지, 본인 패널에만 노출
- [ ] 배지 카운트 = `pending` + 미확인 완료 알림
- [ ] 완료 알림 전환 감지 (`onSnapshot`, `* → completed`, `fromEmail` 본인 조건)
- [ ] 모달 섹션 4 내 완료 알림 시각 강조 + 모달 오픈 시 `seenAt` 갱신으로 강조 제거

### 3.4. 영향 파일

- `src/components/TodoRequestBadge.tsx`
- `src/components/TodoRequestModal.tsx`
- `src/store/todoRequestStore.ts` (`seenAt` 필드, 완료 알림 카운트 로직)

---

## 4. FAB — 패널 내부 진입점

### 4.1. 결정

패널 우하단 44px floating action button(`+` 아이콘), 현재 탭에 따라 context-aware 동작:

- **할일 탭** — 빠른 추가 모달 (후순위 #4 자연어 빠른 추가의 진입점)
- **메모 탭** — 빠른 메모 모달
- **달력 탭** — 일정 생성 모달 (선택된 날짜 또는 오늘 prefill)

엄지 홈 포지션(오른손 엄지 최적). 모바일·데스크탑 동일 위치.

### 4.2. 폼·채팅 분리 — 홈 상단은 채팅, CreatePost는 모달

홈 상단 page-level에는 §6 홈 채팅 기반 입력(자연어 경로)이 자리 잡는다. 기존 CreatePost(폼 경로)는 모달 컴포넌트로 리팩터링되어 FAB 탭 시에만 호출. 두 입력 경로는 완전 분리된다:

- **폼 경로** — 정형 필드(제목·구분·범위·기한)를 직접 채우는 방식. FAB → CreatePost 모달. 모든 항목 명시적.
- **채팅 경로** — 자연어 문장. AI가 파싱·추론. 시나리오에 따라 즉시 저장(§6 시나리오 2) 또는 확인 후 저장(§6 시나리오 3) 또는 복수 항목 승격(§6 시나리오 4).

같은 결과(posts 생성)에 두 길을 두는 이유: 간단·명확한 건 한 줄 말로, 구조적 입력은 폼으로. 사용자는 상황에 맞게 선택. 모바일 프레이밍과도 정합 — 모바일에서 한 패널이 viewport 전체일 때 홈 상단 채팅 입력이 "어느 패널에 추가하는가" 시각 맥락을 패널 그리드 프리뷰와 함께 제공한다(U14).

### 4.3. 독립 PASS 기준

- [ ] FAB 우하단 44px, 엄지 홈 포지션
- [ ] 현재 탭 context 감지 후 해당 모달 호출
- [ ] 홈 상단 CreatePost 영역 제거, 라우팅·기존 기능 회귀 없음
- [ ] 달력 탭 FAB가 선택 날짜 prefill 전달

### 4.4. 영향 파일

- 신규: `src/components/common/FAB.tsx`
- `src/components/Panel.tsx` (FAB 렌더 + context 전달)
- `src/components/CreatePost.tsx` (모달화 리팩터링)
- `src/app/(main)/page.tsx` (기존 상단 영역 제거)

---

## 5. 달력 아키텍처

### 5.1. 결정 — 피어 탭 통합

달력을 패널 탭바의 피어 탭으로 올림: **할일 / 메모 / 달력**. 기존 `/mydesk/calendar` 페이지 폐지.

`/mydesk`는 연차·요청 통계·직원 관리 등 대시보드 용도로 재정의. 달력은 각 패널의 "그 사람의 시간 축"으로 내재화.

### 5.2. 나만/전체 이진 토글

월 네비게이션 바 옆(필터 바 자리와 시각 균형)에 scope 토글 2단계:
- **나만** — 현재 사용자에게 보이는 본인 이벤트만
- **전체** — 현재 사용자에게 보이는 모든 이벤트 (본인 + 공개 대상)

내부 `scope` 인프라는 3단계(`me`/`team`/`all`) 그대로 유지 (calendar-filter.md 기존 구조 존중). UI만 이진으로 노출 — 6명 팀 규모에서 `team ≈ all` 중복 회피 + 직원 혼란 최소화.

**패널별 동작:**
- 본인 패널: 토글 활성 (나만 ↔ 전체 전환 가능)
- 타인 패널: 토글 숨김, 그 사람에게 공개된 이벤트만 표시 (프라이버시 경계)

### 5.3. 수평 스와이프 = 액셀러레이터

주 네비게이션은 **탭 탭핑**. 수평 스와이프는 탭 간 이동의 보조 수단. 이유: 스와이프만으로 숨기면 직원이 달력 존재 자체를 모를 수 있음. 탭 탭핑이 discoverability 기본.

하단 페이지 인디케이터 **없음**. 근거: 상단 탭바 언더라인이 위치 인디케이터 역할 + iOS/Android 시스템 홈 인디케이터와 중복 chrome 회피 + ZARA/COS 미니멀 톤 일관.

배포 후 스와이프 discoverability가 이슈로 드러나면 그때 transient 마이크로 인디케이터(제스처 중에만 페이드인) 추가. 첫 배포엔 상단 탭바만으로 시작.

### 5.4. FAB 동작 — 달력 탭

§4.1과 연결. 달력 탭 활성 상태에서 FAB 탭 시 "일정 생성" 모달. 선택된 날짜가 있으면 해당 날짜 prefill, 없으면 오늘 prefill.

### 5.5. 독립 PASS 기준

- [ ] 패널 탭바에 달력 탭 추가 (할일 / 메모 / 달력)
- [ ] `/mydesk/calendar` 경로 제거, MY DESK 라우팅 재구성
- [ ] 나만/전체 이진 토글 (내부 `scope` 3단계 매핑 유지)
- [ ] 타인 패널에선 토글 숨김, 공개 이벤트만 표시
- [ ] 수평 스와이프로 탭 전환 가능 (액셀러레이터)
- [ ] 하단 페이지 인디케이터 없음, 상단 탭바 언더라인이 유일 위치 표시
- [ ] 달력 탭 FAB가 일정 생성 모달 호출, 날짜 prefill

### 5.6. 영향 파일

- `src/components/Panel.tsx` (탭바에 달력 추가)
- `src/components/Calendar.tsx` (패널 내 렌더, scope 토글 UI)
- `src/components/calendar/**` (월 네비 바 확장)
- `src/app/(main)/mydesk/calendar/page.tsx` (삭제)
- `src/app/(main)/mydesk/layout.tsx` (탭 구성 재편)

---

## 6. 홈 채팅 기반 입력 — A안 인라인 확장

원칙: ux-principles.md U14 인라인 대화 원칙. 패턴: patterns.md P9 인라인 확장 대화 패턴. 토큰: uxui.md §4 홈 채팅 입력 토큰.

### 6.1. 결정 — A안 인라인 확장 + B 승격 하이브리드

홈 상단 자연어 입력 → 바로 아래 확장 영역에서 AI 응답·확인·칩 선택 → 확정 시 접힘. 모달 회피.

**A안 채택 근거.** 실제 사용 패턴 분포상 80%는 "확인 한 번이면 끝"(A로 충분), 20%가 "요청 대상 선택·기한 조율·복수 항목 분리" 같은 다회 대화(B로 승격). 처음부터 B 전면이면 간단 입력도 무겁게 느껴지고, A 전면이면 긴 대화에서 숨 막힘. 임계선(3턴·또는 명확화 실패 2회)에서 자연스럽게 B로 올리는 게 인지 비용 최소.

**대안 탈락.**
- **B안 (사이드 패널 슬라이드 전면):** 구현 복잡도 높고 모바일 레이아웃 재설계 필요.
- **C안 (플로팅 응답 말풍선):** 여러 턴 대화엔 한계, 말풍선 쌓이면 지저분.

### 6.2. A안 목업 구조

- **위치:** 홈 상단 "Hizzi is happy, and you?" 인사말 아래. 인사말과 흐름 이어짐.
- **폭:** 패널 3열 그리드와 정렬.
- **입력 pill:** 높이 52 · border-radius 26 · 한 줄.
- **확장 방향:** 입력창 바로 아래 펼침. 상단 꺾쇠(10×10 · 회전 45deg)로 입력창과 시각 연결.
- **확장 영역:** card-bg · padding 20·24 · margin-top 12.
- **접힘:** 확정·취소 시 원래 한 줄 pill로 복귀.

시각 토큰은 uxui.md §4 홈 채팅 입력 토큰 참조.

### 6.3. 시나리오 플로우

**시나리오 1 — 빈 입력 (placeholder 상태).**
- placeholder: "무엇을 추가할까요?"
- 서브라벨: "· 말하듯 편하게 쓰시면 AI가 분류해드립니다"
- 확장 영역 미노출.

**시나리오 2 — 명확 입력 · 즉시 저장 (50%+ 케이스).**
- 예시 입력: "회의록 메모"
- 내용·구분·범위 모두 명확 추론 가능 → 확장 영역 미노출 + 즉시 저장
- 하단 토스트 5초 "{이름} 패널 · 메모 탭에 추가됨" + 실행 취소 링크 (3층 복구 동선 1층)
- AI 질의 없음

**시나리오 3 — 애매 입력 · AI 확인 (30% 케이스).**
- 예시 입력: "내일 김부장 보고서 초안 정리"
- 바로 아래 확장 영역 펼침
- AI 뱃지 + 응답 "'업무 할일'로 이해했습니다. 기한은 내일(04.23)로 잡을게요. '공개범위'만 골라주시면 추가합니다."
- 파싱 태그: [업무] · [🕐 D-1] · [04.23] + unset 태그 [범위 미정]
- 공개범위 칩 버튼 노출 → 탭 → "추가" 버튼 → 저장 + 확장 영역 접힘 + 토스트
- 목표 소요: 전체 2초

**시나리오 4 — 복수 항목 · B 승격 (20% 케이스).**
- 예시 입력: "회의록 정리하고 홍아현한테 발주서 확인 요청해줘"
- 바로 아래 확장 영역 펼침
- 각 항목을 카드로 분리 표시 (번호 원 + 제목 + 태그들 + unset 조각):
  - 항목 1: "회의록 정리" · [업무] · [🕐 D-1] · [범위 미정]
  - 항목 2: "발주서 확인 요청" · [요청] · [To 홍아현] · [🕐 04.27 월]
- 푸터 "자세한 대화로" 승격 버튼 자동 노출 → 사이드 패널(B안) 전환

### 6.4. 파싱 프리뷰 · AI 뱃지 · 칩 버튼

**파싱 프리뷰 원칙 (P9 재명시).**
AI가 추론한 결과는 태그로 먼저 시각화. 텍스트 응답만으로 "뭐가 맞고 뭐가 틀렸나"를 스캔 비용 크게 만들지 말 것.

**파싱 프리뷰 카드 필드.**
- 제목
- 유형 (업무 / 개인 / 요청 태그)
- 일시 (기한 태그)
- 공개범위 (전체 / 나만 / 특정 태그)
- 요청 대상 (To 태그, 요청일 때)
- unset 태그 — AI가 확정 못한 조각 (예: "범위 미정")

태그는 uxui.md §4 할일/메모 태그 토큰 재사용. unset 태그는 §4 홈 채팅 입력 토큰 내 unset 서브블록.

**AI 뱃지.**
uxui.md §4 홈 채팅 입력 토큰 내 AI 뱃지 서브블록. 확장 영역 좌측에 배치.

**칩 버튼.**
AI가 빠진 조각(unset)만 칩으로 질의. 한 번 탭으로 선택, 푸터 "추가" 버튼으로 확정.

### 6.5. 확정 · 취소 · 토스트

**확정.**
- 저장 위치: 본인 패널의 해당 탭 (AI 파싱 유형에 따라 할일 / 메모 / 일정)
- 확장 영역 접힘
- 하단 토스트: "✓ {이름} 패널 · {탭명} 탭에 추가됨" + 실행 취소 링크 (5초, 3층 복구 동선 1층과 동일)

**취소.**
- 확장 영역 닫힘, 입력 pill 원상 복귀, 저장 없음
- Esc 키로도 동일 동작 (P9 접근성 조항)

**토스트.**
전역 토스트 컴포넌트 재사용. 신규 토큰 없음.

### 6.6. B 승격 임계선 · 대화 승계

**승격 조건 (U14 재명시):**
- 3턴 이상 필요 (명확화 질문 2회째) or
- 복수 항목 + 각각 미확정 조각

승격 버튼 "자세한 대화로" — 푸터 secondary 위치. 트리거 조건 만족 시 자동 노출.

**대화 승계 (U14).**
인라인에서 B로 전환 시 누적된 대화 상태 유지. 처음부터 다시 묻지 않음.

### 6.7. Phase 분할 — 첫 구현 범위

**첫 구현에 포함:**
- 입력 pill (시나리오 1 placeholder)
- 확장 영역 (시나리오 3)
- AI 뱃지
- 파싱 프리뷰 카드 (제목·유형·일시·공개범위·요청 대상·unset)
- 공개범위 칩 버튼
- 확정 / 취소 / 토스트
- "자세한 대화로" 승격 버튼 (푸터 노출까지)
- 복수 항목 카드 UI (시나리오 4 시각 분리)

**첫 구현에서 제외:**
- 사이드 패널(B안) 본체 — placeholder 골격만
- 대화 상태 승계 로직
- AI 파싱 엔진 품질 튜닝 (별도 트랙)

첫 구현으로 80% 케이스 커버 가능(시나리오 2·3).

### 6.8. 독립 PASS 기준

- [ ] 홈 상단 채팅 입력 pill 렌더, 패널 3열 그리드와 정렬
- [ ] placeholder "무엇을 추가할까요?" · 서브라벨 "· 말하듯 편하게 쓰시면 AI가 분류해드립니다"
- [ ] 시나리오 2 — 명확 입력 즉시 저장 + 토스트 5초 + 실행 취소 링크
- [ ] 시나리오 3 — 확장 영역 펼침 + AI 뱃지 + 파싱 프리뷰 + unset 태그 + 공개범위 칩 + 확정으로 저장
- [ ] 시나리오 4 — 복수 항목 카드 분리 표시 + "자세한 대화로" 승격 버튼 자동 노출 (사이드 패널 본체는 placeholder)
- [ ] Esc 키로 취소 동일 동작
- [ ] 모달 사용 없음 (U14 인라인 대화 원칙)
- [ ] 기존 CreatePost 상단 영역 제거 확인 (§4.2 폼·채팅 분리)
- [ ] 확장 애니메이션 0.2s ease-out · prefers-reduced-motion 즉시 펼침 폴백

### 6.9. 영향 파일

- 신규: `src/components/ChatInput.tsx` — 입력 pill
- 신규: `src/components/ChatExpand.tsx` — 확장 영역 (AI 응답·파싱 프리뷰·칩·푸터)
- 신규: `src/components/AiBadge.tsx` — AI 뱃지 조각 (재사용 의도)
- 신규: `src/store/chatInputStore.ts` — 대화 상태 관리 (zustand)
- 신규: `src/lib/parseIntent.ts` — AI 파싱 추상 레이어
- 수정: `src/app/(main)/page.tsx` — 홈 상단 배치 + 기존 CreatePost 상단 영역 제거

CreatePost 모달화는 §4.2 폼·채팅 분리 구현 시점에 처리 (본 섹션 범위 밖).

---

## 7. 실행 순서

- **§1 패널 높이 + ⋯ handle + 능동 scroll** — **완료(세션 #61)**. §1 PASS 전항 통과, handle C안 하단 경계 배치, 2단 wrapper 구조, 능동 scroll 정렬, 다층 방어 5층 유지.
- **§6 홈 채팅 기반 입력** — **다음 1순위**. 시나리오 1~3 완전 구현 + 시나리오 4 placeholder UI 골격. CreatePost 모달화는 §4.2 맥락에서 별도 처리.
- **§2 완료·삭제 대칭** — 2층까지 완료(세션 #60, RecordModal·회수 링크). **블록 ③-B 후순위**: 3층 탭바 메뉴 "기록" 진입점 + flows.md FLOW 1 복구 cascade 정교화.
- **§3 요청 봉투 + 완료 알림(U10)** — 후순위 후보. 봉투 per-panel 위치 유지, 배지 카운트 확장(pending + 미확인 완료 알림), 모달 섹션 4 강조 로직.
- **§4 FAB + CreatePost 재배치** — §6 채팅 입력 완료 후 §4.2 폼·채팅 분리 맥락에서 진입.
- **§5 달력 피어 탭** — 범위 가장 넓음. 탭바 확장 + MY DESK 리라우팅 + scope 토글 + 수평 스와이프 액셀러레이터.

각 섹션 완료마다 1-6 배포 + progress.md 갱신.

---

## 8. 설계 파급 정리

### 8.1. 디자인 토큰 추가 (uxui.md)

- 스크롤바: 폭·색상 (§1)
- fade-out 그라데이션 (§1)
- handle 토큰 — 크기·chevron·색·bottom·z-index·transition (§1.2a)
- 능동 scroll 토큰 — scroll-margin-top·rAF·lock·reduced-motion 폴백·rollback (§1.2b)
- 스와이프 트랙·"삭제" 라벨 배경 (§2)
- FAB: 본체·hover 상태 (§4)
- 홈 채팅 입력 토큰 — 입력 pill·확장 영역·AI 뱃지·파싱 프리뷰·unset 태그·항목 카드·번호 원·푸터 버튼 3종 (§6)

### 8.2. Firestore 스키마 영향

- `posts` 컬렉션:
  - `deletedAt` 필드 추가 (soft delete 시점) — 24시간 창 계산 + 30일 hard delete 기준
  - `completedAt` 필드 확보 (이미 있으면 활용, 없으면 추가) — 24시간 창 계산
- `todoRequests` 컬렉션:
  - `seenAt` 필드 추가 — 완료 알림 강조 해제 기준
- `users` 컬렉션: 변경 없음

### 8.3. Firestore Rules

기존 rules 그대로 통과 (새 필드는 기존 쓰기 권한에 자동 포함, 별도 rules 수정 불필요).

### 8.4. 휴지통 hard delete 처리

휴지통 30일 경과분 hard delete:
- 구현: Cloud Function(스케줄러) 또는 주기적 클라이언트 측 배치 — 구현 단계에서 결정
- 현재 6명 팀 규모에선 hard delete 지연돼도 Firestore 비용 이슈 없음
- 본 범위에선 `deletedAt` 필드만 먼저 추가, hard delete 자동화는 §2 구현 시 판단

---

## 9. 연동 MD 갱신

본 정비로 업데이트되는 원칙·패턴·토큰 문서:

**ux-principles.md:**
- U6 삭제 원칙 — 스와이프 제스처 + 3층 복구 반영
- U7 완료 처리 원칙 — 대칭 회수 동선 추가
- U10 완료 알림 원칙 — 🔲 미구현 해제, 배지 + 모달 섹션 4 강조 로직 확정
- U11 모바일 대응 원칙 — FAB 위치 · 탭 간 스와이프 액셀러레이터 명시
- U12 대칭 설계 원칙 — 완료·삭제 대칭 회수 동선
- U13 능동 scroll 정렬 원칙 — 브라우저 자동 scroll 개입 덮어쓰기 (§1.2b 첫 적용)
- U14 인라인 대화 원칙 — 자연어 입력 AI 응답 같은 스레드 확장 (§6 첫 적용)

**patterns.md:**
- P8 ⋯ 펼쳐보기 handle 패턴 — 2단 wrapper·hasOverflow·능동 scroll·다층 방어·접근성·E2E assertion 원칙
- P9 인라인 확장 대화 패턴 — 구조·시나리오 분기·B 승격 임계·파싱 프리뷰 원칙·접근성
- P10 FAB 패턴 (기존 P8) — 위치·context-aware 동작
- P11 스와이프 제스처 패턴 (기존 P9) — 터치·마우스·트랙패드 통합 처리

**uxui.md:**
- §4 할일/메모 태그 (2026.04.06 확정)
- §4 버튼 색상
- §4 스와이프 삭제 토큰
- §4 FAB 토큰
- §4 handle 토큰 (신규, §1.2a)
- §4 능동 scroll 토큰 (신규, §1.2b)
- §4 홈 채팅 입력 토큰 (신규, §6 — 입력 pill·확장 영역·AI 뱃지·파싱 프리뷰·unset 태그·항목 카드·번호 원·푸터 버튼 3종 서브블록)
- §5 컴포넌트 상태 — 무변경 (스크롤바·fade-out은 §6 패널 스크롤에 정의)

**master.md:**
- §4 파일 구조 — FAB.tsx · RecordModal.tsx · ChatInput.tsx · ChatExpand.tsx · AiBadge.tsx 신규 반영
- §5 파일 의존성 맵 — FAB → CreatePost 모달 / RecordModal → postStore / ChatInput → chatInputStore → parseIntent 의존 추가
- `/mydesk/calendar` 경로 제거

**flows.md:**
- FLOW 1 요청 cascade — 3층 복구 경로(토스트·하단 링크·기록 메뉴)에서의 상태 복귀 규칙 추가 (블록 ③-B 구현 시점으로 이관)

세부 문구는 본 정비 각 섹션 구현 완료 시점에 맞춰 before/after 검수 후 갱신. ux-principles.md U13·U14 · patterns.md P8·P9·P10·P11 재편 · uxui.md 토큰 3블록은 세션 #62에서 복구 완료(세션 #61 설계 · #62 MD 작성).

---

*2026-04-23 세션 #62 — §1.2a/b/c · §1.3 확장 · §4.2 폼·채팅 분리 · §6 채팅 입력 · §7~§9 재편 (세션 #61 설계, 세션 #62 복구)*
