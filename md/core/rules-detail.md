# 히찌보드 — 코딩 규칙 상세 (S1~S9)

> rules.md 체크리스트의 근거가 되는 상세 규칙.
> 새 규칙 추가 시: "왜 이 실수가 반복되는가"를 반드시 함께 기록한다.
> "잘 모르겠다"는 답이 나오면 → 즉시 멈추고 실제 파일을 먼저 확인한다.

---

## S1. 상태 전환 & 연쇄 업데이트

### 반복 버그의 근본 원인
이 앱의 상태 변경은 절대 단독으로 끝나지 않는다.
하나의 상태 변경은 항상 2~3개 문서를 함께 업데이트해야 한다.
일부만 업데이트하면 UI와 데이터 불일치가 발생한다.

**R1.1 — 상태 변경 코드 작성 전 반드시 `hizzi-flows.md`를 먼저 확인한다**

**R1.2 — 필수 연쇄 처리 목록**
```
post.completed = true  → todoRequests.status = 'completed'  (requestId 있을 때)
post.completed = false → todoRequests.status = 'accepted'   (requestId 있을 때)
요청 수락              → post 생성 + calendarEvent 생성 (dueDate 있을 때)
요청 반려              → rejectReason 저장
요청 할일 삭제         → post.deleted = true + todoRequests.status = 'cancelled'
```

**R1.3 — 팀 요청: teamRequestId로 캘린더 중복 생성 방지**

---

## S2. 에러 처리

**R2.1 — 모든 catch 블록에 addToast를 포함한다**
```typescript
} catch (e) {
  console.error(e)
  addToast({ message: '저장에 실패했습니다. 다시 시도해주세요.', type: 'error' })
}
```

**R2.2 — 삭제 등 파괴적 액션은 낙관적 업데이트 패턴 사용**

**R2.3 — 루프 안의 비동기 작업은 try/catch/finally로 감싼다**

---

## S3. Firestore 저장 안전

**R3.1 — Firestore에 undefined를 절대 저장하지 않는다**

**R3.2 — 날짜 문자열: toISOString() 사용 금지 (KST 환경에서 날짜 하루 밀림)**

**R3.3 — serverTimestamp() pending 문서 방어**
```typescript
if (!data.createdAt) return null  // pending 문서 제외
```

**R3.4 — 필드 삭제 시 deleteField() 사용**
```typescript
import { deleteField } from 'firebase/firestore'
await updateDoc(ref, { attachment: deleteField() })
```

**R3.5 — 새 컬렉션 추가 시 배포 전에 Firestore rules 업데이트**

---

## S4. 명령 블록 작성 원칙

**R4.1 — 모든 명령 블록 맨 앞에 안전 규칙 명시**
```
규칙: 대상 코드를 찾지 못하면 즉시 중단하고 보고할 것. 임의 적용 금지.
```

**R4.2 — 모든 명령 블록 끝에 진행 여부 반드시 명시**

**R4.3 — 파일 수정 + commit + vercel --prod 반드시 한 블록**

**R4.4 — 블록 끝에 "배포 후 확인 항목" 포함**

**R4.5 — 파일 수정 방식: 이 기준만 따른다**
```
변경이 파일 전체의 30% 이상이거나 다수 위치에 분산 → 전체 교체
변경이 파일 전체의 30% 미만이고 위치가 명확       → 부분 교체 (R4.6)

str_replace를 여러 블록으로 분할 제시 금지.
```

**R4.6 — 부분 교체 시 실수 방지**
```
1. 교체 대상 문자열이 파일 내 1회만 등장하는지 확인
2. 파일 경로 + 찾을 문자열(전후 2줄 포함) + 바꿀 문자열 → 단일 powershell 블록
```

**R4.7 — PowerShell here-string 방식 (전체 교체 시)**
```
TSX/TS 파일 전체 교체 시 → @"..."@ 사용 (큰따옴표 here-string)
TSX 내부 큰따옴표 → backtick(`) 으로 이스케이프
@'...'@ (작은따옴표 here-string) 사용 금지 — TSX 코드 작은따옴표와 충돌하여 블록 중간 절단 발생
```

**R4.8 — 명령 블록 실행 원칙**
```
빌드 에러 시만 중단 + 보고
정상 빌드 → commit + deploy 자동 진행
```

---

## S5. TypeScript 타입 안전

**R5.1 — any 타입 사용 금지**

**R5.2 — Firestore 업데이트 객체는 `Partial<T>` 사용**

**R5.3 — any가 불가피한 경우 오너 명시적 승인 후 TODO 주석 추가**

---

## S6. 설계 정확성

**R6.1 — 실제 파일에 없는 값을 조건에 추가하지 않는다**

**R6.2 — Claude Code 리뷰 에이전트 경고는 실제 파일을 직접 열어 확인한다**

**R6.3 — 미래 확장을 위한 방어 코드는 오너 승인 후 추가한다**

---

## S7. 공개범위 (visibleTo)

```
[]                        → 전체 공개
[author]                  → 나만
[author, ...otherEmails]  → 특정인
```

**R7.1 — 특정인 저장 시 author를 반드시 포함한다**

**R7.2 — 표시 로직은 세 가지 상태를 모두 처리해야 한다**

**R7.3 — 수정 팝업은 생성 폼과 동일한 옵션을 제공한다 (축소 금지)**

**R7.4 — 수정 팝업 초기값은 저장된 visibleTo를 역산해서 세팅한다**

---

## S8. UI & 모달 패턴

**R8.1 — 모든 모달에 useEscClose를 사용한다**
```typescript
useEscClose(() => setIsOpen(false), isOpen)
```

**R8.2 — hover 레이어에 negative margin 금지 → `inset: 0` 사용**

**R8.3 — overflow:auto 안의 드롭다운은 createPortal + position:fixed 사용**

**R8.4 — z-index 계층 (이탈 금지)**
```
패널 내부: 10 / 드롭다운: 100 / 모달 오버레이: 1000
모달 본체: 1001 / 캘린더 모달: 50 / 캘린더 더보기: 70 / Toast·Portal: 9999
ImageViewer: 1100
```

**R8.5 — transition은 0.15s ease만 사용**

**R8.6 — 공통 컴포넌트 우선 원칙**
```
새 기능 개발 전 아래 목록을 먼저 확인한다.
이미 공통 컴포넌트가 있으면 반드시 사용하고, 인라인으로 재구현 금지.
공통 컴포넌트가 없지만 2개 이상 곳에서 쓰일 가능성이 있으면
인라인 구현 전에 공통 컴포넌트로 먼저 만들고 적용한다.

현재 공통 컴포넌트 목록 (우선순위 순):
  ✅ ImageViewer       — src/components/common/ImageViewer.tsx
                         ESC 닫기 포함. 이미지 표시 시 반드시 사용.
  🔲 AttachmentManager — 첨부파일 편집 UI (추가/삭제/열기)
  🔲 VisibilitySelector — 범위 선택 (전체/나만/특정 + 유저 선택)
  🔲 TaskTypeSelector  — 구분 선택 (업무/개인)
  🔲 ModalShell        — 모달 껍데기 (헤더/상태바/바디/푸터 P8 구조)
  🔲 DueTag            — 기한 뱃지 (D-3 이내 색상 분기)
  🔲 TagBadge          — 카테고리·범위 뱃지
  🔲 UserChip          — 팀원 선택 칩

공통 컴포넌트 위치: src/components/common/
```

---

## S9. Store Listener 초기화 원칙

**R9.1 — 모든 Firestore onSnapshot은 initXxxListener() 함수로 분리한다**

**R9.2 — initXxxListener()는 반드시 user?.email 확정 후 호출한다**

**R9.3 — 동일 데이터를 사용하는 모든 페이지에 listener를 주입한다**

**R9.4 — listener 에러 핸들러에 반드시 addToast를 포함한다**

**R9.5 — store loading은 페이지 전체 게이트가 아닌 해당 컴포넌트 렌더 조건으로만 사용한다**

---

## 별첨. 공통 훅 목록

```
useEscClose(onClose, isOpen)            — 모든 모달 필수. window.__escStack 전역 스택 방식.
useVisibilityTooltip(visibleTo, users)  — PostItem / TodoItem 특정인 tooltip
useFileUpload(panelId)                  — 예정: Storage 업로드
useIsMobile(breakpoint)                 — 예정: 모바일 감지
useCanEdit(ownerEmail)                  — 예정: 수정 권한 확인
useMultiSelect(items)                   — 예정: 체크박스 다중 선택
```

---

### R4.9 코드 스터디 원칙

자체 구현 전 외부 솔루션 조사를 1단계로 강제한다.

**트리거**
- 새 기능 (UI 위젯 / 데이터 구조 / 인터랙션 패턴)
- 같은 버그 1회 수정 실패 + 범용 도메인
- 범용 도메인 문제 (렌더링·정렬·날짜·레이아웃·입력·상태 동기화 등)

**1단계 산출물 (조사 보고)**
- 후보 라이브러리 3개 이상 (없으면 "조사 결과 없음" 명시)
- 비교 항목: 라이센스 / 번들 사이즈 / 데이터 모델 호환성 / 커스터마이징 / 유지보수 상태
- 추천안 + 근거
- 자체 구현 추천 시 부적합 사유 명시 의무

**금지**
- 조사 0건 상태로 자체 구현 명령 블록 작성
- "주어진 코드 안에서 답을 찾기" 프레임에 갇히기
- 1차 실패 후 동일 프레임으로 2차 사이클 진입

**근거**: 세션 #6/#7 멀티데이 row 5차 사이클. 자체 구현 프레임 함정.
