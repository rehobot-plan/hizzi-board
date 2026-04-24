# 공통 Header — 설계 문서

> 세션 #43 설계 + 세션 #46 재조정 결과. 구현 시 이 문서를 라우팅 표에 포함.
> 수정: 오너 승인 필수.

---

## 0. 개요

공통 Header는 전 페이지 상단에 고정되는 가로 바. 좌측 브랜드 문구와 우측 계정 액션을 상시 노출.

- 목적: 로그인/로그아웃 버튼 위치가 페이지 이동해도 동일 유지 + 브랜드 문구 상시 노출
- 대상: `/login`, `/signup` 제외 전 페이지
- 레이아웃 위상: 사이드바 옆(메인 영역 상단)에만 표시, 사이드바 위로 올라가지 않음

---

## 1. 레이아웃 (패턴 B)

```
┌─────────────┬────────────────────────────────────────┐
│             │  HEADER (메인 영역 상단, sticky)       │
│             ├────────────────────────────────────────┤
│  SIDEBAR    │  TABBAR (MY DESK 한정, Header 아래)    │
│  (전체 고정)├────────────────────────────────────────┤
│             │                                        │
│             │  MAIN CONTENT (스크롤)                 │
│             │                                        │
└─────────────┴────────────────────────────────────────┘
```

- 사이드바: 뷰포트 전체 높이 고정 (position sticky, top 0)
- Header: 메인 영역 상단만, 사이드바 높이 침범 안 함
- TabBar (MY DESK 전용): Header 바로 아래 부착, 상단 고정 스택 구성

---

## 2. Header 구조

### 2.1 높이와 위치

- 높이: 72px (min-height)
- 배경: #FDF8F4 (페이지 배경과 동일 크림 톤, sticky 시 스크롤 콘텐츠 차단)
- 하단 경계: 1px solid #EDE5DC
- 위치: `position: sticky; top: 0; z-index: 50` (드롭다운 100 · 모달 1000 보다 낮게)
- 좌우 패딩: 32px

### 2.2 좌우 영역

좌측 — 고정 문구:
- `"Hizzi is happy, and you?"` 상시 표시
- 폰트: 15px weight 500 color #2C1810
- 페이지별 동적 매핑 없음 (브랜드 문구 고정)

우측 — 계정 액션 영역:
- 아바타+이름(프로필 진입점) + 관리자 모드 버튼 + 로그아웃 버튼 가로 배치
- 아바타+이름: 원형 아바타(28px) + 사용자명 텍스트, 클릭 시 프로필 수정 모달 오픈 (profile.md 5·7)
  - photoURL 빈 값이면 기본 아바타 (profile.md 6: 빈 원 + "?" 표시)
  - hover 시 배경 #F5F0EE 전환, transition 0.15s ease
- 관리자 모드 버튼: `pathname === '/' && user.role === 'admin'` 일 때만 렌더
  - 라벨: `adminMode ? '관리자 모드 닫기' : '관리자 모드'`
  - 클릭: `useAdminModeStore.toggle()`
- 로그아웃 버튼: 기존 `useAuthStore.signOut` 호출
- 두 버튼 공통 스타일: border 1px solid #C17B6B, color #C17B6B, background white, padding 4px 12px, font-size 12px, letter-spacing 0.05em, hover background #FDF8F4
- 간격: 12px

### 2.3 제외 페이지

- `/login`, `/signup`은 Header 렌더하지 않음 (루트 layout.tsx 또는 AppShell에서 경로 기반 분기)

---

## 3. TabBar 스택 구성 (MY DESK 한정)

- MY DESK 경로(`/mydesk/*`)에서만 TabBar 렌더
- 위치: Header 바로 아래, `position: sticky; top: 72px`
- 높이: 48px
- 배경: #FDF8F4 (main-bg, Header와 분리감)
- 하단 경계: 1px solid #EDE5DC

결과: MY DESK 진입 시 상단 120px가 고정 영역, 그 아래 본문 스크롤.

---

## 4. 파일 구조

```
src/
├── app/
│   ├── layout.tsx              루트 layout (html/body만, AppShell 없음)
│   ├── (main)/
│   │   ├── layout.tsx          <AppShell>{children}</AppShell>
│   │   ├── page.tsx            홈
│   │   ├── mydesk/             MY DESK (layout + 탭 페이지들)
│   │   ├── request/            요청
│   │   └── leave/              연차
│   ├── (auth)/
│   │   ├── layout.tsx          <>{children}</> (AppShell 없음)
│   │   ├── login/              로그인
│   │   └── signup/             가입
│   └── hana-vote/              독립 앱 (route group 밖)
├── components/
│   └── common/
│       ├── Header.tsx
│       └── AppShell.tsx        Sidebar + Header + children 래핑
├── store/
│   └── adminModeStore.ts       관리자 모드 전역 상태 (Zustand, 세션 #46 신설)
```

- `AppShell.tsx`: (main) 그룹 전용 래핑. 분기 로직 없음.
- Route group으로 구조 분리하여 경로 기반 분기 코드 불필요.
- `/login`, `/signup`은 (auth) 그룹 → AppShell 미적용.
- `/hana-vote/*`는 route group 밖 → AppShell 미적용.

---

## 5. 상태 의존성

- `usePathname()`: 관리자 모드 버튼 조건부 렌더 판정용 (`pathname === '/'`)
- 관리자 역할: `useAuthStore(s => s.user?.role === 'admin')`
- 관리자 모드 상태: `useAdminModeStore(s => s.adminMode)` / `s.toggle`
- 로그아웃: `useAuthStore(s => s.signOut)` 재사용

추가 store — `src/store/adminModeStore.ts` 신설 (Zustand):
- 상태: `adminMode: boolean` (초기값 false)
- 액션: `toggle()`, `setAdminMode(v: boolean)`
- page.tsx가 구독해서 관리자 UI(사용자 관리·연차 관리·복구) 렌더 토글

---

## 6. 반응형

Tailwind `md` breakpoint (768px) 기준.

- 데스크톱 (≥768px): 표준 레이아웃
- 모바일 (<768px):
  - Header 높이 유지 (72px)
  - 관리자 모드·로그아웃 버튼 기본 노출. 화면이 좁아 깨지면 관리자 모드 우선 숨김 — 구현 세션에서 최종 결정
  - TabBar: 가로 스크롤 허용 (5탭이 한 줄에 안 들어가면)

---

## 7. 구현 Phase

### Phase H-1 — AppShell + Header 기본 구조 (완료, 재조정 반영)

초기 완료 (세션 #45, 커밋 c23bd23):
- AppShell.tsx 신설, Header.tsx 신설 (좌측 제목 + 우측 사용자명·로그아웃), 루트 layout.tsx 전환, `/login`·`/signup` 우회

재조정 (세션 #46, 2026-04-20):
- Header 톤을 홈 페이지 기존 박스 구조로 맞춤 — 높이 72, 배경 transparent, 좌우 패딩 32
- 좌측 고정 문구 `"Hizzi is happy, and you?"` 배치 (페이지별 동적 매핑 폐기)
- 우측 재구성 — 사용자명 제거, 관리자 모드 버튼(홈 + admin만) + 로그아웃 버튼으로 교체
- page.tsx 내부 `<header>` 블록 제거, adminMode 상태 `useAdminModeStore`로 이전, handleLogout 제거
- 로그아웃 후 `/login` 리다이렉트가 onAuthStateChanged로 자동 처리되는지 구현 단계 확인
- 영향: `src/components/common/Header.tsx`, `src/app/(main)/page.tsx`, `src/store/adminModeStore.ts` (신설)

### Phase H-2 — TabBar 상단 고정 전환
- 현 MY DESK TabBar.tsx를 AppShell 내부로 이동 또는 sticky 변환
- Header·TabBar 스택 스타일 정합
- MY DESK 본문 top padding 조정 (120px offset)

### Phase H-3 — Sidebar 전체 고정 적용
- 현 Sidebar.tsx에 `position: sticky; top: 0; height: 100vh` 적용
- 내부 스크롤 허용 (메뉴 많아질 경우 대비)
- "기타" 서브메뉴를 하단 고정 (flex-column + margin-top auto)

### 각 Phase 완료 기준
- H-1: 전 페이지 진입 시 상단 72px Header 렌더, 좌측 고정 문구 표시, 관리자 모드 버튼(홈 + admin만)·로그아웃 정상 동작, 로그인/회원가입만 예외
- H-2: MY DESK 스크롤 시 Header + TabBar 상단 고정 유지
- H-3: 사이드바 스크롤 독립, 기타 메뉴 하단 고정 동작

각 Phase는 독립 세션. R4.10 3축 PASS 보고 필수.

---

## 8. 알려진 제약

1. `position: sticky`는 부모 컨테이너에 `overflow: hidden/auto`가 있으면 동작하지 않음. AppShell 루트에서 overflow 설정 주의.
2. 기존 페이지 본문 상단의 중복 UI는 Header와 통합:
   - MY DESK의 "MY DESK" H1 — 세션 #45에서 제거 완료 (페이지 식별은 사이드바 active 상태·TabBar가 담당)
   - 홈 페이지 내부 `<header>` 블록(관리자 모드·로그아웃) — 세션 #46 재조정에서 제거, 공통 Header로 이관
   - leave·request 본문 H1 — 선처리 큐 (H-2·H-3 이후)
3. 모달이 z-index 1000 이상이므로 Header(50)와 충돌 없음.

---

*Updated: 2026-04-20 (세션 #46 H-1 재조정 — 좌측 고정 문구, 우측 관리자 모드·로그아웃, sticky 배경 불투명 처리)*
