# hizzi-Board AGENTS.md

## 역할
실행 담당 AI — 코드 작성·실행·Git·에러 수정
기획/설계는 Claude.ai에서 완료됨

## 앱 개요
사내 온라인 게시판 (3×2 그리드 6분할)
담당자는 본인 칸에만 게시 / 관리자는 전체 관리
콘텐츠: 텍스트·이미지·링크

## 기술 스택
Next.js (App Router) + TypeScript + Tailwind CSS
Zustand / Firebase (Firestore + Auth + Storage) / Vercel
작업 경로: D:\Dropbox\Dropbox\hizzi-board

## 핵심 원칙
- 코드 전 계획 설명 → 승인 후 구현
- 컴포넌트 하나씩 작은 단위로
- `any` 타입 절대 금지
- 데스크톱 풀사이즈 우선 (1920px)
- Firebase 키: NEXT_PUBLIC_FIREBASE_* / 서버 전용 키: NEXT_PUBLIC 금지

## 보고 방식 (필수)
- 중간 보고 금지
- 최종 결과 한 줄만: `✅ [기능] 완료 - [확인방법]`
- 빌드 순서: lint → npm run build → 동작 확인 → 커밋 → 보고

## 토큰 절약 규칙
- 세션 1개 = 작업 1개. 완료 후 커밋 → /clear
- 요청은 파일명/함수명까지 구체적으로
- 같은 버그 3회 반복 시 접근 방식 전면 재검토
- 빈 catch 블록 절대 금지

## ⚠️ 알려진 이슈
- next.config.ts → next.config.js 로 생성
- Firestore orderBy + where → 클라이언트 정렬로 대체
- Firestore 리스너 → useEffect 반환값으로 반드시 unsubscribe
- npm run build 성공 ≠ 동작 정상. 실제 동작까지 확인
- Windows 한글 경로 → npm 오류. 영문 경로 유지

## 커밋 규칙
feat / fix / refactor / style / chore
기능 하나 완성마다 즉시 커밋
- Keep components functional and use hooks
- Prefer composition over inheritance
- Mirror existing file organization when adding new features
- Test locally with `npm run dev` before committing

## Common Tasks

### Adding a New Page
1. Create directory in `src/app/[page-name]`
2. Add `page.tsx` file
3. Export default React component

### Adding a New Component
1. Create file in `src/components/[ComponentName].tsx`
2. Use TypeScript with proper prop typing
3. Import and use in pages or other components

### Adding State to Store
1. Edit or create store file in `src/store/`
2. Define interfaces for state
3. Create store with Zustand's `create()` function
4. Import and use with `useStore()` hook in components

## Deployment

- Deploy to Vercel for optimal Next.js performance
- Environment variables must be set in deployment platform
- Build locally with `npm run build` to verify before pushing
