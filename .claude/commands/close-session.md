---
세션을 종료합니다. 아래 순서대로 실행해줘.

1. 이번 세션에서 완료한 작업 목록 정리해서 보여주기
2. md/log/progress.md 읽기
3. 현재상태 섹션 replace 내용 제안 (오너 확인 후 적용)
4. 작업로그 append 내용 제안 (오너 확인 후 적용)
5. md/core/master-debt.md 부채 트래커 갱신 필요 여부 확인 후 제안
6. .harness/MEMORY.md 갱신 필요 여부 확인 후 제안
7. 아이디어 인박스 처리:
   a. .harness/ideas-inbox.md 읽기
   b. "---" 아래에 항목이 있으면:
      - 전체 항목을 오너에게 출력
      - "이 항목들을 Claude.ai에 전달하여 분류받으세요" 안내
      - 오너가 Claude.ai 분류 결과를 가져와 승인하면:
        → master-debt.md / session.md 반영
        → ideas-inbox.md 항목 삭제 (헤더+구분선만 남김)
   c. 비어있으면 "인박스 비어있음" 출력 후 다음 단계
8. 다음 세션 프리셋 업데이트:
   a. md/log/progress.md "다음 TODO" 1순위 항목 확인
   b. 해당 작업에 필요한 MD + src 파일 리스트를 오너에게 Claude.ai 제안 요청
   c. 오너가 Claude.ai 분류 결과를 가져와 승인하면:
      → D:\Dropbox\Dropbox\md-presets\presets.json 의 "current" 엔트리
         files/description 갱신 (타임스탬프 .bak 의무)
      → 갱신 후 새 files 배열 출력
   e. ⚠️ presets.json 갱신 후 PowerShell에서 `프리셋` 명령 반드시 실행.
      _staging 실물 복사 누락 시 다음 세션이 구버전 파일로 시작됨.
      세션 종료 전 오너가 `프리셋` 실행 완료를 Claude Code에 보고해야 close-session 종료 처리.
   f. 생략 조건: 오너가 명시적으로 "프리셋 생략"이라고 말한 경우

9. 아래 명령 실행:
   Remove-Item -Force .harness/session-started.flag -ErrorAction SilentlyContinue

완료되면 "세션 종료 완료 ✅" 출력.
