# 🚀 단일 앱 빠른 시작 템플릿

> **사용법:**
> 새 프로젝트 시작할 때 이 파일을 복사해서
> [ ] 표시된 항목들을 채워넣고 Claude.ai에 첨부하면 바로 시작 가능

> 🤖 **Claude에게:**
> 이 파일을 받으면 빈 항목 [ ] 확인 후
> 채워지지 않은 항목은 사용자에게 먼저 물어보고 시작하세요.
> 세팅 순서는 섹션 5 "자동화 세팅 순서"를 따르세요.

---

## 1. 앱 기본 정보

| 항목 | 내용 |
|---|---|
| 앱 이름 | hizzi-Board |
| 한 줄 설명 | 모니터 풀사이즈 6분할 레이아웃의 사내 온라인 게시판 |
| 타겟 유저 | 사내 직원 (담당자별 게시 권한) 및 관리자 |
| 핵심 기능 | ① 6분할 게시판 (담당자별 칸 관리) ② 텍스트·이미지·링크 게시 ③ 칸 확대 보기 및 게시물 다운로드 |
| 플랫폼 | 웹 (데스크톱 풀사이즈 우선, 추후 모바일 반응형) |

---

## 2. 확정 기술 스택

| 항목 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js (App Router) | API 보안, 모든 환경 호환 |
| 언어 | TypeScript | 타입 안전성 |
| 스타일링 | Tailwind CSS | 빠른 UI 개발 |
| 상태관리 | Zustand | 가볍고 확장 용이 |
| DB | Firebase Firestore | 실시간 동기화, 무료 한도 넉넉 |
| 인증 | Firebase Authentication | 이메일/비밀번호 |
| 스토리지 | Firebase Storage | 이미지 파일 저장 (Blaze 요금제) |
| 배포 | Vercel | Next.js 최적 궁합, 자동 배포 |
| UI 컴포넌트 | shadcn/ui | 완성도 높은 기본 컴포넌트 |

---

## 3. 환경 정보

| 항목 | 내용 |
|---|---|
| OS | Windows |
| IDE | VS Code + Claude Code |
| Node.js | v24.14.0 |
| 프로젝트 경로 | D:\Dropbox\Dropbox\hizzi-board |
| Firebase 프로젝트 ID | hizzi-board |
| GitHub 계정 | rehobot-plan |
| GitHub 레포 | rehobot-plan/hizzi-Board |

---

## 4. Firebase 설정 값 (기존 hizzi-board 재사용)

```js
const firebaseConfig = {
  apiKey: "AIzaSyBg0gvRT6UoBrZmAZCj8zDEXbjFNPw4Bgs",
  authDomain: "hizzi-board.firebaseapp.com",
  projectId: "hizzi-board",
  storageBucket: "hizzi-board.firebasestorage.app",
  messagingSenderId: "532541236079",
  appId: "1:532541236079:web:998f3d2a3ee38126093e9a"
};
```

> ⚠️ 이 키는 .env.local에만 보관하고 코드에 직접 절대 노출 금지

---

## 5. Firestore 데이터 구조

```
users/
  {userId}/
    profile:
      name: string
      email: string
      role: "admin" | "member"
      panelId: string | null     ← 담당 게시판 칸 ID (없으면 null)
      createdAt: timestamp

panels/
  {panelId}/                     ← 6개 고정 (panel-1 ~ panel-6)
    title: string                ← 칸 제목 (부서명 등)
    assignedUserId: string | null
    order: number                ← 표시 순서 (1~6)
    createdAt: timestamp

posts/
  {postId}/
    panelId: string
    authorId: string
    type: "text" | "image" | "link"
    content: string              ← 텍스트 내용 or 링크 URL
    imageUrl: string | null      ← Storage URL (이미지 타입일 때)
    fileName: string | null      ← 원본 파일명
    createdAt: timestamp
```

---

## 6. 컬러 팔레트

```
배경          #FFFFFF (흰색)
페이지 bg     #F0FAFA (연민트)
포인트        #81D8D0 (티파니 민트)
테두리 진     #A8E4DF
테두리 연     #C5EDEB
입력 bg       #F7FFFE
텍스트        #1A1A1A (K95 블랙)
서브텍스트    #999999
```

---

## 7. 자동화 세팅 순서 (✅ 검증된 순서)

> 🤖 Claude에게: 아래 순서대로 진행하고 각 단계 완료 시 체크하세요.
> Claude Code에서 할 수 있는 건 직접 실행, 웹 UI가 필요한 건 사용자에게 안내.

### Phase 0 — 환경 세팅 (첫 세션)

**웹에서 직접 해야 하는 것 (순서 중요)**
- [x] GitHub 레포 생성 ✅ (rehobot-plan/hizzi-Board, gh CLI로 자동 생성)
- [x] Firebase 프로젝트 생성 ✅ (hizzi-board 재사용)
- [x] Firebase Authentication 활성화 ✅ (이메일/비밀번호)
- [x] Firebase Firestore 생성 ✅ (asia-northeast3)
- [x] Firebase Storage 활성화 ✅ (Blaze 요금제)
- [x] Firebase 웹 앱 등록 + firebaseConfig 확보 ✅
- [x] Vercel 배포 완료 ✅ → https://hizzi-board.vercel.app

**Claude Code에서 자동으로 하는 것**
- [x] Next.js 프로젝트 초기화 ✅ (TypeScript + Tailwind + App Router)
- [x] .env.local 파일 생성 ✅ (Firebase 키 세팅)
- [x] .gitignore 확인 ✅ (.env.local 포함)
- [x] AGENTS.md 프로젝트 컨텍스트 작성 ✅
- [ ] Firebase 초기 데이터 생성 스크립트 실행 (admin 계정 + 6개 패널)
- [x] GitHub 첫 커밋 + push ✅
- [ ] Vercel 환경변수 등록

**⚠️ 알려진 이슈 (이번 세팅 중 발생)**
- `next.config.ts` → `next.config.js` 로 변경 필요 (Next.js 버전 호환 문제)
- GitHub CLI(`gh`) 로 레포 생성 가능 — `gh auth login` 한 번만 하면 이후 자동화
- Claude Code 채팅창과 PowerShell 터미널 혼동 주의 (한글 입력은 채팅창에만)

### Phase 1 — 핵심 기능 개발

- [ ] 기본 레이아웃 (3×2 그리드, 풀사이즈)
- [ ] Firebase Auth 연동 + 로그인 화면
- [ ] 6분할 게시판 패널 컴포넌트
- [ ] 게시물 작성 (텍스트 / 이미지 / 링크)
- [ ] 패널 확대 보기 모달
- [ ] 게시물 다운로드 기능
- [ ] 관리자 패널 (사용자·담당자 관리)
- [ ] 에러 처리 + 로딩 UI

### Phase 2 — 완성도

- [ ] Firestore 보안 규칙 강화 (테스트 모드 → 프로덕션)
- [ ] 모바일 반응형 최적화
- [ ] 오프라인 대응
- [ ] Vercel 최종 배포

---

## 8. AI 워크플로우

```
[ Claude.ai — 메인 ]
  기획 · 설계 · MD 관리 · 코드 리뷰
  → 구현 계획 수립 후 Claude Code에 전달

        ↓

[ Claude Code — 보조 실행 ]
  파일 생성 · 명령 실행 · Git · 에러 수정
  → AGENTS.md 자동 로드로 컨텍스트 유지
```

### Claude Code 승인 규칙
| 상황 | 선택 |
|---|---|
| "Do you want to proceed?" | 1. Yes |
| git 명령어 반복 승인 | 2. Yes, don't ask again |
| 프로젝트 폴더 접근 | 2. Yes, allow from this project |

### Claude Code 보고 방식
> 🤖 Claude Code에게: 아래 규칙을 항상 따르세요.

- 각 단계 완료 후 **스스로 검증까지 완료**하고 최종 결과만 한 줄 요약으로 보고
- 중간 과정은 보고하지 않아도 됨
- 형식: `✅ [기능명] 완료 - [확인 방법 or URL]`
- 예시: `✅ 로그인 기능 완료 - localhost:3000/login 정상 동작`

### 토큰 절약 전략 (검증된 방법 기반)
> 🤖 Claude Code에게: 아래 규칙을 반드시 따르세요.

**핵심 원칙: 토큰의 99.4%는 읽기에서 소비됨 → 덜 읽게 만드는 게 핵심**

**1. .claudeignore 설정 (최우선)**
- node_modules/, dist/, *.lock, *.min.js 등 불필요한 파일 차단
- 프로젝트 시작 시 반드시 생성

**2. AGENTS.md 50줄 이하 유지**
- 매 턴마다 읽히므로 핵심만 유지
- 중복 내용, 일반적인 조언 제거

**3. 모델 선택 기준**
- 기획/설계/디버깅 → Opus (필요할 때만)
- 코드 구현 80% → Sonnet (기본값)
- 단순 수정/생성 → Haiku
- Agent Teams teammate → 반드시 Sonnet

**4. 세션 관리**
- 세션 1개 = 작업 1개 (기능 하나, 버그 하나)
- 작업 완료 후 커밋 → `/clear` 로 컨텍스트 초기화
- 새 작업 시작 시 `/compact Focus on code samples` 로 요약

**5. 구체적인 요청**
- ❌ "이 코드베이스 개선해줘" → 전체 파일 스캔
- ✅ "src/components/Panel.tsx 의 알림 리스너 cleanup 추가해줘"

**6. 반복 작업 방지**
- 같은 버그 3회 이상 반복 시 접근 방식 전면 재검토
- 빌드 전 TypeScript lint 오류 먼저 확인

**7. 환경변수 설정 (선택)**
```powershell
$env:DISABLE_NON_ESSENTIAL_MODEL_CALLS=1
```

---

## 9. AGENTS.md 템플릿

> Claude Code 프로젝트에 아래 내용으로 AGENTS.md 생성

```markdown
# hizzi-Board 프로젝트 컨텍스트

## 역할
- 실행 담당 AI
- 코드 작성, 실행, Git, 에러 수정 담당
- 기획/설계는 Claude.ai에서 완료됨

## 앱 개요
- 사내 온라인 게시판 (3×2 그리드 6분할)
- 담당자는 본인 칸에만 게시, 관리자는 전체 관리
- 콘텐츠 타입: 텍스트 / 이미지 / 링크

## 핵심 원칙
- 코드 작성 전 계획 먼저 설명하고 승인 받기
- 작은 단위로 쪼개서 구현
- any 타입 절대 금지
- 데스크톱 풀사이즈 우선 (1920px 기준), 모바일은 Phase 2
- API 키는 절대 코드에 직접 작성 금지

## 기술 스택
- Next.js (App Router) + TypeScript + Tailwind CSS
- Zustand / Firebase (Firestore + Auth + Storage) / Vercel

## 환경변수
- Firebase 키: NEXT_PUBLIC_FIREBASE_*
- 서버 전용 키: NEXT_PUBLIC 절대 금지

## 커밋 규칙
feat / fix / refactor / style / chore
기능 하나 완성마다 바로 커밋

## 에러 처리
원인 분석 먼저, 수정 나중
빈 catch 블록 절대 금지

## 알려진 이슈 (이전 버전 경험)
- Firestore orderBy + where 복합 쿼리는 인덱스 필요 → 클라이언트 정렬로 대체
- Windows 한글 경로에서 npm 오류 → 영문 경로 사용
- Storage는 Blaze 요금제 필요 (이미 설정됨)
- next.config.ts → next.config.js 로 변경 필요 (Next.js 버전 호환)
- 작업 경로: D:\Dropbox\Dropbox\hizzi-board
```

---

## 10. .env.local 구조

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBg0gvRT6UoBrZmAZCj8zDEXbjFNPw4Bgs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hizzi-board.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hizzi-board
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hizzi-board.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=532541236079
NEXT_PUBLIC_FIREBASE_APP_ID=1:532541236079:web:998f3d2a3ee38126093e9a
```

---

## 11. Firestore 보안 규칙

**개발 중 (테스트용)**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**프로덕션 (Phase 2에서 적용)**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
                   || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /panels/{panelId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
                    || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.panelId == request.resource.data.panelId);
      allow delete: if request.auth.uid == resource.data.authorId
                    || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 12. 코드 품질 체크리스트

> 🤖 Claude에게: 기능 완성마다 아래 항목 체크하세요.

- [ ] any 타입 없음
- [ ] try-catch 에러 처리 있음
- [ ] 데스크톱(1920px) 레이아웃 정상
- [ ] API 키 코드에 노출 없음
- [ ] 커밋 완료

---

## 13. 개발 현황 (매 세션 업데이트)

| 단계 | 내용 | 상태 |
|---|---|---|
| Phase 0 | 환경 세팅 | ✅ 완전 완료 |
| Phase 1 | 핵심 기능 개발 | 🔄 진행 중 |
| Phase 2 | 완성도 & 배포 | ⬜ |

### 완료된 작업
- Firebase 프로젝트 생성 및 설정 (hizzi-board)
- 기획 및 스펙 확정
- GitHub CLI 인증 + 레포 자동 생성 (rehobot-plan/hizzi-Board)
- Next.js + TypeScript + Tailwind + Zustand + Firebase 설치
- .env.local Firebase 설정 완료
- AGENTS.md 생성 완료
- GitHub 첫 커밋 + push 완료
- localhost:3000 정상 동작 확인 ✅
- Vercel 배포 완료 ✅ → https://hizzi-board.vercel.app
- Firebase 초기 데이터 생성 (admin 계정 + 6개 패널)
- 로그인/로그아웃 화면
- 6분할 게시판 레이아웃
- 게시물 작성 (텍스트/이미지/링크)
- 드래그 앤 드롭 이미지 업로드
- 게시물 우클릭 편집/삭제 메뉴 (웹)
- 게시물 길게 누르기 편집/삭제 메뉴 (모바일)
- 확대 보기 모달
- 실시간 업데이트 알림 토스트
- 회원가입 (이름 입력 → 패널 이름으로 설정)
- 패널 이름 변경 기능
- 1인 1패널 권한 관리
- 패널 드래그 앤 드롭 위치 교환 + Firestore 저장
- 관리자 모드 (사용자 리스트 + 삭제)

### 다음 할 일 (한도 리셋 후)
- 알림 중복 버그 완전 해결 (Firestore 리스너 cleanup)
- 비밀번호 확인 칸 일치 시 가입 버튼 활성화
- Vercel 최종 배포 및 환경변수 확인
- Phase 2 — 보안 규칙 강화 + 모바일 반응형

### 주요 결정사항
- 기술 스택: React(CRA) → Next.js (App Router) + TypeScript로 변경
- 배포: Netlify → Vercel로 변경
- Firebase hizzi-board 프로젝트 재사용
- 인증: 이메일/비밀번호 (Google 로그인 미사용)
- GitHub 레포 생성: 웹 UI 대신 `gh repo create` CLI로 자동화
- Claude Code 보고 방식: 최종 결과만 한 줄 요약으로 보고

---

*hizzi-Board 프로젝트 템플릿 | Ver 1.1 | 2026.03.26*
*✅ Phase 0 완료 — localhost:3000 정상 동작 확인*
