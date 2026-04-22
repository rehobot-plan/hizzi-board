# MD 프리셋 가이드

## 사용법
- PowerShell: `프리셋1` / `프리셋2` 등 별칭 실행
- 결과: _staging/ 폴더에 파일 복사됨
- Claude.ai 방에 _staging/ 내용 드래그

## 프리셋 목록

### 프리셋1 — 캘린더 실작업 / 기능 추가용 (11종)
세션 3종 + 도메인 3종(flows/master/master-schema) + 캘린더 소스 3종 + calendar-helpers + leaveStore
용도: 캘린더 기능 추가, 버그 수정, 상태 흐름 변경 동반 작업

### 프리셋2 — 캘린더 디자인 통일용 (10종)
세션 3종 + rules-detail + UI 3종(ux-principles/patterns/uxui) + 캘린더 소스 3종
용도: 스타일링, 디자인 토큰 적용, FullCalendar 테마 커스터마이징

## 프리셋 추가하는 법

1. `presets.json` 열기
2. 기존 엔트리 뒤에 콤마 + 새 엔트리 추가:
```json
   "프리셋N": {
     "description": "용도 한 줄 설명",
     "files": [
       "절대경로1",
       "절대경로2"
     ]
   }
```
3. 경로는 Windows 백슬래시 이스케이프 (`\\`)
4. PowerShell 프로필에 별칭 추가 (최초 1회):
```powershell
   Set-Alias 프리셋N "D:\Dropbox\Dropbox\md-presets\프리셋.ps1"
```
   또는 기존 별칭이 인자 방식이면 불필요
5. 드라이런: `프리셋N` 실행 후 _staging/ 확인
6. 파일 누락 시 presets.json 경로 수정 → 재실행

## 명명 규칙
- 번호는 생성 순서, 의미 없음
- description 첫 줄에 "용도 키워드" 명시 (다음에 어떤 프리셋을 쓸지 검색 편의)
- 파일 개수는 description 끝에 표기 (종)
