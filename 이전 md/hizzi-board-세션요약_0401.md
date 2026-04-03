# Hizzi Board 세션 요약 (2026.04.01)

> 새 대화창에 이 파일 + hizzi-board-프로젝트문서_v2.md 첨부하고 시작하세요.

---

## 오늘 완료된 작업

### 게시판
- [x] 탭 이동 목록 구버전 탭(결재 등) 필터링
- [x] panelStore 구버전 categories 자동 마이그레이션
- [x] 관리자 활동 시 사용자 알림 제거

### 사용자/패널 관리
- [x] 관리자 패널 배정 완전 제거 (Firestore 초기화 포함)
- [x] 신규 가입 시 빈 패널 자동 배정
- [x] 빈 패널 없으면 패널 없이 가입 성공
- [x] 관리자 모드 패널 추가 기능
- [x] 미배정 사용자 상단 표시 + "미배정 N명" 카운트
- [x] 사용자 이름 인라인 편집
- [x] 계정 삭제 확인 모달
- [x] 고아 계정 복구 기능 (계정 복구 탭)
- [x] auth/email-already-in-use 시 Firestore users 문서 새로 생성
- [x] 복구 계정 패널 권한 버그 수정 (email 기반 권한 통일)

### 달력
- [x] 타임존 버그 수정 (T00:00:00 로컬시간)
- [x] 반복 일정 UI 간소화 (요일 칩 제거, 클릭 요일 자동 설정)
- [x] 반복 일정 이후 일괄 삭제 기능
- [x] 연차 블락 연결 UI (같은 사용자만 연결)
- [x] 연차 드래그 날짜 유지 버그 수정
- [x] 연차 등록 대상자 선택 (권한별 분기)

### 연차 관리
- [x] leaveStore.ts 생성 (calcAnnualLeave, calcUsedLeave 등)
- [x] LeaveManager.tsx 생성
- [x] 전체 직원 연차 현황 표 (이름|입사일|발생|수동입력|예정|확정사용|총사용|잔여)
- [x] 예정/확정 구분 (오늘 이후=예정, 오늘 이전=확정)
- [x] 잔여 마이너스 허용 + 빨간색 표시
- [x] 연차 26일 허용 (유리 해석), 이월 누적 정책
- [x] 1년 미만 월별 연차(11일) + 1년 이상(15일~25일) 별도 합산
- [x] 입사일 숫자 8자리 자동변환 (20240801 → 2024-08-01)
- [x] 날짜 지난 연차 자동 확정(🔒), 관리자만 수정 가능
- [x] 연차 열람 권한 드롭다운 (없음/본인/전체)
- [x] 관리자 모드 연차 관리 탭

### 공지사항
- [x] 패널 실제 이름 표시 ([panel-3] → 실제 패널명)
- [x] 작성자 이름 표시 (이메일 제거)
- [x] 날짜+시간 표시
- [x] 내용 더 많이 표시 (100자), 줄바꿈 처리

---

## 현재 미완성 작업

### 🔴 즉시 필요
- [ ] 연차 열람자(leaveViewPermission==='all') 화면에 예정 컬럼 표시
  - 문제: isReadOnlyAllViewer 분기로 관리자 표와 다른 컴포넌트 사용
  - 해결: isReadOnlyAllViewer ? null 블록 제거, 편집기능만 isAdmin으로 분리
  - 명령어: LeaveManager.tsx에서 표를 하나로 통일, 편집은 isAdmin일 때만

- [ ] 사이드바 하단 "연차 사용 내역" 버튼 추가
  - leaveViewPermission 없거나 'none'이면 숨김
  - 클릭 시 연차 화면으로 이동 (메인 레이아웃 유지)

- [ ] HIZZI BOARD 로고 클릭 시 홈(/) 이동

### 🟡 다음 단계
- [ ] AI 채팅 통합 (히찌보드 사이드바에 채팅 패널 추가)
- [ ] 사용자용/관리자용 A4 사용설명서 제작
- [ ] 소프트 딜리트 (삭제된 게시물 관리자 복구)

---

## Firestore 데이터 구조 (최신)

### users
```typescript
{
  id, name, email, role?, panelId?,
  leaveViewPermission?: 'none' | 'me' | 'all'
}
```

### leaveSettings
```typescript
{
  id, userId, userName, joinDate,
  manualUsedDays, createdAt, updatedAt
}
```

### leaveEvents
```typescript
{
  id, userId, userName, userEmail,
  date, type: 'full'|'half_am'|'half_pm',
  days: 1|0.5, memo?, confirmed,
  createdAt, createdBy
}
```

---

## 연차 계산 정책 (확정)

```
1년 미만: 매월 1일 × 근속월수 (최대 11일)
1년 이상: 15일 + floor((근속년수-1)/2) (최대 25일)
합산 최대: 26일 (유리 해석)
이월: 누적 가능 (소멸 없음)
예정: 오늘 이후 날짜 연차
확정: 오늘 포함 지난 날짜 연차
총사용: 수동입력 + 예정 + 확정
잔여: 발생 - 총사용 (마이너스 허용, 빨간색)
```

---

## 권한 구조

```
관리자
├── 전체 기능
├── 연차 등록/수정/삭제 (확정 포함)
└── 모든 직원 연차 대장 관리

leaveViewPermission === 'all'
├── 전체 직원 연차 표 열람 (수정 불가)
└── 본인 연차 등록 가능

leaveViewPermission === 'me'
└── 본인 연차만 조회/등록

leaveViewPermission === 'none' 또는 없음
└── 연차 메뉴 숨김
```

---

## 새 세션 시작 템플릿

```
작업 경로: D:\Dropbox\Dropbox\hizzi-board
첨부: 이 파일 + hizzi-board-프로젝트문서_v2.md

오늘 할 작업:
1. LeaveManager.tsx 수정
   - isReadOnlyAllViewer ? null 블록 제거
   - 표를 하나로 통일 (isAdmin || canViewAllLedger)
   - 편집기능(입사일수정, 기사용입력, 저장버튼, 연차추가, 수정/삭제)은 
     isAdmin일 때만 표시
   - 열람자는 표만 보임 (예정 컬럼 포함)

2. page.tsx 사이드바
   - HIZZI BOARD 클릭 시 홈(/) 이동
   - 하단 사용자 이름 위에 "연차 사용 내역" 버튼
   - leaveViewPermission 없거나 'none'이면 버튼 숨김
   - 클릭 시 showLeave 상태로 연차 화면 전환
     (페이지 이동 말고 메인 레이아웃 유지하면서)
```

---

## 알려진 버그 & 해결책

| 버그 | 해결책 |
|------|--------|
| 파일 교체 안 됨 | 파일 탐색기에서 직접 삭제 후 붙여넣기 |
| 빌드 에러 반복 | 파일 완전 새로 작성 |
| 날짜 하루 밀림 | T00:00:00 로컬시간 사용 |
| EBUSY 오류 | .next 삭제 후 재빌드 |
| git 커밋 실패 | git config core.safecrlf false, git repack -a -d -f |
| 복구 계정 패널 사용 불가 | email 기반 권한 체크로 통일 |
| 파일 인코딩 깨짐 | Get-Content -Encoding UTF8로 읽기 |

---

*작성일: 2026.04.01*
