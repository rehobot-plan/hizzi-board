# 프로필 시스템 — 설계 문서

> 사용자 시각 정보(사진·부서·직책·이름) 통합 관리 설계.
> 관련 구현: Phase P-1 / P-2 / P-3.
> 수정: 오너 승인 필수.

---

## 1. 개요

- 목적: 사용자 시각 정보(사진·부서·직책·이름)를 통합 관리
- 대상:
  - Sidebar 하단 아바타 영역 제거 (H-3 구조 재편)
  - Header 우측 이름 + 프로필 진입점 추가 (H-1 부분 롤백)
  - 프로필 수정 모달 신설
  - 패널 제목 옆 프로필 사진 노출
- 연관 설계: header.md (Header 우측 재수정 동기화 대상)

---

## 2. 데이터 모델 (Firestore users 컬렉션 확장)

- 기존 필드: name / email / role (현재 필드 목록은 구현 블록 1-1 탐색에서 확인)
- 추가 필드:
  - `photoURL: string` — Firebase Storage 경로 URL. 없으면 빈 문자열
  - `department: string` — 부서, 자유 입력
  - `position: string` — 직책, 자유 입력
- 마이그레이션: 기존 사용자 문서에 3필드 기본값(`""`)을 일괄 추가

---

## 3. Firebase Storage 경로

- 경로: `profiles/{uid}.jpg` (단일 파일, 덮어쓰기)
- Storage Rules 추가:
  - `profiles/{uid}` 읽기: `request.auth != null`
  - `profiles/{uid}` 쓰기: `request.auth.uid == uid`
- 기존 첨부파일 경로와 분리 (마이그레이션·정리 간섭 방지)

---

## 4. 업로드 + 크롭 플로우

- 라이브러리: `react-easy-crop` (CLAUDE.md [6] R4.9 범용 도메인 오픈소스 우선 원칙)
- 저장 스펙: 크롭된 정사각 500x500 JPEG만 업로드 (원본 미저장)
- 덮어쓰기 정책: 새 업로드 시 동일 경로 덮어쓰기
- 실패 처리: rules.md 체크리스트 "모든 catch에 addToast" 준수

---

## 5. 프로필 수정 모달

- 트리거: Header 우측 이름 클릭
- 위치: 모달 오버레이 (patterns.md P3 준수)
- 필드:
  - 사진 (원형 미리보기 + "변경" 버튼 → 파일 선택 → 크롭 UI → 저장)
  - 이름 (text input)
  - 부서 (text input)
  - 직책 (text input)
- 저장 동작:
  - Firestore `users/{uid}` 업데이트 (변경된 필드만)
  - 사진 변경 시에만 Storage 업로드
- 취소 동작: ESC / 백드롭 클릭 / 취소 버튼
- `useEscClose` 적용 (rules.md 체크리스트)

---

## 6. 기본 아바타 (사진 미설정 상태)

- 표시: 빈 원 + "?" 문자
- 색상: background `#F5F0EE` / color `#9E8880` (uxui.md 토큰)
- 의도: 비어있음을 명시해 교체 동기 자극
- 크기: 표시 위치별 차등
  - Header 우측: ~28px
  - 패널: ~40px (지름 1.5cm 목표)

---

## 7. Header 우측 재수정 (H-1 부분 롤백)

- 현재 (H-1 재조정 결과): 관리자 모드 버튼 + 로그아웃 버튼, 이름 없음
- 변경 후: `[아바타 원형 + 이름] + [관리자 모드 버튼] + [로그아웃 버튼]`
- 이름 영역:
  - 아바타 원형 (photoURL 있으면 이미지, 없으면 기본 아바타)
  - 이름 텍스트
  - 클릭 시 프로필 모달 오픈
- `header.md §2.2` 동기화 (본 문서 확정 후 header.md 수정 블록으로 반영)

---

## 8. Sidebar 하단 아바타 제거

- 대상: H-3에서 만든 `sidebar-avatar` 영역 전체 제거
- H-3 3분할 구조 → 2분할 전환
  - 기존: 주요 메뉴 / 기타 섹션 (mt-auto) / 아바타
  - 변경: 주요 메뉴 / 기타 섹션 (mt-auto)
- 이유: Header 우측과 중복 표시 해소

---

## 9. 패널 프로필 노출

- 위치: 패널 제목 옆 좌측 (정확한 위치는 구현 블록 1-1 탐색에서 실측 확인)
- 크기: 원형 ~40px (지름 1.5cm 목표)
- 렌더:
  - `photoURL` 있으면 이미지 (Storage URL)
  - 없으면 기본 아바타 (§6)
- 클릭 동작: 없음 (표시 전용)
- 참조: master.md 패널 구조

---

## 10. 부서·직책 편집 방식

- 자유 입력 (text input)
- 드롭다운·자동완성 없음
- 이유: 6명 규모 대비 관리 오버헤드 > 유연성 이득

---

## 11. Firestore Rules

- `users` 쓰기 권한: 기존 "본인 또는 admin" 유지 (master.md §7)
- 신규 필드 추가로 권한 변경 불필요

---

## 12. 구현 Phase

- **Phase P-1** — 기반 준비
  - Firestore 스키마 확장 (기존 문서 마이그레이션)
  - Storage 경로·Rules 배포
  - react-easy-crop 설치
- **Phase P-2** — UI 통합
  - 프로필 수정 모달 신설
  - Header 우측 재수정 (H-1 부분 롤백)
  - Sidebar 아바타 영역 제거 (H-3 2분할 전환)
- **Phase P-3** — 패널 노출
  - 패널 제목 옆 프로필 사진 렌더

각 Phase는 독립 세션. R4.10 3축 PASS 보고 필수.

---

*Created: 2026-04-20 (프로필 시스템 설계 신설)*
