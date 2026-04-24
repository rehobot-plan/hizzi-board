# HIZZI Harness Memory Index

> 클로드 세션 간 기억 인덱스. 각 항목은 1줄, 150자 이내.
> 상세 내용은 같은 폴더의 개별 파일에 저장한다.
>
> **박제 임계:** 동일 패턴 2회 이상 관측 시에만 신규 박제. 1회 사례는 progress.md 교훈 란에 남기고 MEMORY 진입 보류. 6개월·세션 30건 미재발 항목은 소각 대상 (별도 세션 일괄 처리).

## User

## Feedback

## Project

## Reference

## Claude.ai context 텍스트 사실성 편향 (세션 #54)

- 현상: `<documents>` 태그로 받은 포맷 잡힌 "완료 보고"(커밋 해시·Vitest·회귀·배포 URL 포함)를 검증 없이 사실로 수용
- 결과: 허구 전제 위에 session-54-close.md + 통합 제안 생성. 저장소 확인 전까지 불일치 무감지
- 회피: 사실 누적이 중요한 단계(세션 종료·부채 갱신·프리셋 변경) 진입 전 Code 저장소 실측 보고 1회 선행. 텍스트 수용은 가능, 사실 베이스 판단은 분리

## "완료 보고"의 형식이 사실을 대체하지 않는다 (세션 #55)

- 관찰: 세션 #54가 커밋 해시·테스트 숫자("회귀 22/22 PASS")·배포 URL까지 포함된 잘 포맷된 완료 보고로 마감됐으나, 세션 #55 Step E 재검증에서 실제 Playwright 80 PASS · 5 FAIL로 드러남
- 구조적 한계: Claude.ai는 Code 터미널 출력을 직접 볼 수 없고 전달된 텍스트만 본다. 이 텍스트의 진위를 Claude.ai 내부에서 검증할 수단이 없다
- 대응:
  · 사실 누적이 중요한 단계(세션 종료·긴 파이프라인 종반)는 저장소 실측 선행
  · 포맷 잡힌 완료 보고일수록 신뢰 편향 강하다 → 형식과 사실을 분리 검증
  · 세션 #55 Step A~F 같은 재검증 파이프라인이 이 구조를 방어하는 장치로 기능. 긴 세션·복수 커밋 누적 시 재검증 파이프라인 triggered by default

## MD 비대화 → context 주입 실패 패턴 (세션 #51·#66 재현)

- 관찰: 세션 #51 progress.md(259줄)가 context 문서 블록에 내용 빈 채로 로드. 세션 #67 진입 시 progress.md(16K)·master-debt.md(18K) 동일 패턴 재현 — 첨부는 됐으나 context 미주입
- 원리: "큰 파일 = 더 많은 정보 전달"이 아니라 "큰 파일 = 주입 실패 위험"
- 방어선: (1) 세션 시작 시 5개 첨부 MD 내용 기반 주입 확인 선행 (2) 주입 실패 감지 시 view 도구로 /mnt/user-data/uploads/ 직접 읽어 복구 (3) 설계 문서 착수 직전 신설 원칙 유지 (4) 작업로그 3건 이상 시 아카이브 (5) progress.md 300줄 임계 관찰

## 문서 암묵 전제 구조는 실제 파일에서 확인 (세션 #50·#52 통합)

- 패턴: 설계·기획 논의 중 "X 필드 존재"·"Y 엔티티 쓰임" 같은 구조 전제가 기억·추측 베이스로 박힌 채 규칙 추가. 확인 없이 진입하면 오분류·이식 실패
- 사례: #50 calendar-filter §2.2 taskType 암묵 전제 (실제 Calendar UI 저장 경로 미저장 → fallback 규칙이 개인 색상 이벤트 오분류) · #52 히찌보드 메모 엔티티 부재 오판 (실제는 post.taskType='memo' 기존 존재)
- 원칙: "X 필드 부재 시 Y 처리" 류 규칙 도입 전 X가 어느 저장 경로에서 실제로 쓰이는지 payload 레벨 확인. 외부 문서 이식 시 타겟 엔티티·필드 구조 대조 선행

## #61-b Playwright click actionability scroll 우회 (세션 #61·#65 재적용)

- 관찰: Playwright `locator.click()`은 actionability 체크에서 scrollIntoViewIfNeeded 내장 수행. scroll position 검증 베이스라인을 오염시켜 false fail 유발
- 우회: `locator.evaluate(el => el.click())`로 DOM 프로그래매틱 클릭 사용. 브라우저 scroll 개입 없이 onClick 트리거. 마우스 경로 실측이 필요하면 `page.mouse.move + down + up` 분리 시퀀스
- 적용: scroll·viewport·focus 위치 관련 검증 시 Playwright `click()` 대신 programmatic 또는 mouse primitive 사용. actionability scroll은 "click이 성공했는가" 관심일 때만 안전

## #66-a 방어선 위치 전환 원칙 (세션 #54·#66)

- 관찰: 세션 종료 12단계 압축 중 검수 기반 초안을 "시스템 자체 정확도 높일 방향"으로 재설계. 방어선을 검수에서 Code 실측 + Claude.ai 근거 매칭으로 옮기자 부담 동일·정확도 상승 양립 가능
- 2회 이상 관측: 세션 #54 Code 저장소 실측 선행 원칙 + 세션 #66 단계 2·3 신설 구조화
- 원칙: drift 방어를 "사람 개입 루틴"에 의존하지 않는다. 공장 내부 규약(Code 실측 + 주장-근거 매칭)으로 구조화 가능한 방어는 그쪽으로 옮긴다. 검수는 구조화 불가능한 판단(프리셋 선정 같은 재량)에만 남긴다
- 글로벌 기준 정합: 르호봇 상용화 시 개입 밀도 낮출 수 있는 구조
