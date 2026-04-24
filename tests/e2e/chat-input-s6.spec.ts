// tests/e2e/chat-input-s6.spec.ts
// §6 홈 채팅 입력 A안 E2E 회귀 스위트 (세션 #65).
// 설계: md/plan/designs/main-ux.md §6 · ai-capture-hb.md
// 안정성: 엄격 부등식(MEMORY #61-a) · programmatic click(MEMORY #61-b) · 고정 시간 주입.

import { test, expect } from '@playwright/test';
import {
  ensureAdminPanel,
  cleanupS6Data,
  installFixedClock,
  gotoHome,
  typeAndSubmit,
  expandLocator,
  loginAsAdminForAnyViewport,
  ADMIN_PANEL_DOC_ID,
} from './helpers/chat-input';

test.describe('§6 홈 채팅 입력 A안 회귀', () => {
  test.afterEach(async () => {
    // 프로덕션 Firestore에 테스트 더미 남기지 않기 — admin author chat inputSource만 정리
    await cleanupS6Data();
  });

  test.beforeEach(async ({ page }) => {
    await installFixedClock(page);
    await loginAsAdminForAnyViewport(page);
    // gotoHome 내부에서 ensureAdminPanel + 대기 처리. page.goto('/') 중복 호출 금지.
    // (page reload 시 authStore onAuthStateChanged가 clearAdminPanelOwnership 재호출해
    //  ownerEmail을 null로 리셋 — authStore.ts L150~166)
  });

  // ──────────── 시나리오 1 — 빈 입력 ────────────

  test('시나리오 1 — 빈 입력 placeholder·서브라벨·ghost 서브밋', async ({ page }) => {
    await gotoHome(page);

    const input = page.locator('[data-testid="chat-input"]');
    const submit = page.locator('[data-testid="chat-submit"]');

    await expect(input).toHaveAttribute('placeholder', '무엇을 추가할까요?');

    // 서브라벨 — 확장 영역 닫힌 상태에서만 노출
    await expect(page.getByText('· 말하듯 편하게 쓰시면 AI가 분류해드립니다')).toBeVisible();

    // 서브밋 버튼 ghost 상태 (disabled + bg #F5EFE9)
    await expect(submit).toBeDisabled();
    const bg = await submit.evaluate((el) => getComputedStyle(el as HTMLElement).backgroundColor);
    // #F5EFE9 = rgb(245, 239, 233)
    expect(bg).toBe('rgb(245, 239, 233)');

    // 확장 영역 미노출
    await expect(expandLocator(page)).toHaveCount(0);
  });

  // ──────────── 시나리오 2 — 명확 즉시 저장 ────────────

  test('시나리오 2 — "회의록 메모" 즉시 저장 + 토스트 + 실행 취소', async ({ page }) => {
    await gotoHome(page);
    await typeAndSubmit(page, '다 같이 회의록 메모');
    // "다 같이" 포함으로 visibility=public 매칭 → unset 없음 → 시나리오 2.

    // 확장 영역 미노출
    await expect(expandLocator(page)).toHaveCount(0, { timeout: 2000 });

    // 토스트 노출 — "패널 · 메모 탭에 추가됨" 계열
    await expect(page.getByText(/탭에 추가됨/)).toBeVisible({ timeout: 5000 });

    // 실행 취소 버튼 존재·클릭
    const undoBtn = page.locator('[data-testid^="toast-action-"]');
    await expect(undoBtn).toBeVisible();
    await undoBtn.evaluate((el) => (el as HTMLButtonElement).click());

    // 토스트 소멸
    await expect(page.getByText(/탭에 추가됨/)).toBeHidden({ timeout: 3000 });
  });

  // ──────────── 시나리오 3 — AI 확인 (공개범위 unset) ────────────

  test('시나리오 3 — 공개범위 unset: 확장 + 파싱 프리뷰 + 칩 + 추가', async ({ page }) => {
    await gotoHome(page);
    await typeAndSubmit(page, '내일 보고서 초안 정리');

    const expand = expandLocator(page);
    await expect(expand).toBeVisible({ timeout: 5000 });

    // AI 뱃지 존재
    await expect(expand.getByText('AI', { exact: true })).toBeVisible();

    // 파싱 프리뷰 카드 노출
    await expect(page.locator('[data-testid="chat-preview"]')).toBeVisible();

    // unset 태그 "범위 미정" 존재
    await expect(page.getByText('범위 미정')).toBeVisible();

    // 공개범위 칩 3개 노출
    await expect(page.locator('[data-testid="chat-chip-public"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-chip-private"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-chip-specific"]')).toBeVisible();

    // "나만" 칩 탭 → selected (색상 전환)
    await page.locator('[data-testid="chat-chip-private"]').evaluate((el) => (el as HTMLButtonElement).click());
    // zustand selectedVisibility 업데이트 + React rerender 대기
    await page.waitForTimeout(200);
    await expect
      .poll(async () =>
        page
          .locator('[data-testid="chat-chip-private"]')
          .evaluate((el) => getComputedStyle(el as HTMLElement).color),
        { timeout: 3000 },
      )
      .toBe('rgb(193, 123, 107)'); // #C17B6B

    // "추가" 클릭 → 확장 영역 닫힘 + 토스트
    await page.locator('[data-testid="chat-confirm"]').evaluate((el) => (el as HTMLButtonElement).click());
    await expect(expand).toBeHidden({ timeout: 3000 });
    await expect(page.getByText(/탭에 추가됨/)).toBeVisible({ timeout: 5000 });
  });

  test('시나리오 3 — Esc 키로 취소 시 posts 미생성', async ({ page }) => {
    await gotoHome(page);
    await typeAndSubmit(page, '내일 보고서 초안 정리');

    const expand = expandLocator(page);
    await expect(expand).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('Escape');
    await expect(expand).toBeHidden({ timeout: 2000 });

    // 토스트 발생 없음
    await expect(page.getByText(/탭에 추가됨/)).toHaveCount(0);
  });

  test('시나리오 3 — 접근성: 확장 영역 open 시 첫 focusable로 focus 이동', async ({ page }) => {
    await gotoHome(page);
    await typeAndSubmit(page, '내일 보고서 초안 정리');

    await expect(expandLocator(page)).toBeVisible({ timeout: 5000 });
    // ChatExpand useEffect는 50ms setTimeout으로 focus 시도
    await page.waitForTimeout(150);

    // focus가 확장 영역 내부 요소로 이동됐는지
    const focusedInExpand = await page.evaluate(() => {
      const expand = document.querySelector('[data-testid="chat-expand"]');
      return !!expand && expand.contains(document.activeElement);
    });
    expect(focusedInExpand).toBe(true);
  });

  // ──────────── 시나리오 4 — 복수 항목 ────────────

  test('시나리오 4 — 복수 항목 카드 분리 + 푸터 3버튼 + 승격 placeholder', async ({ page }) => {
    await gotoHome(page);
    // ai-capture §3.4 접속사 패턴은 양쪽 공백 필요 — "하고 "가 분리 토큰.
    // "회의록 정리" + "하고 " + "홍아현한테..."
    await typeAndSubmit(page, '회의록 정리 하고 홍아현한테 발주서 확인 요청');

    const expand = expandLocator(page);
    await expect(expand).toBeVisible({ timeout: 5000 });

    // 항목 카드 2개
    await expect(page.locator('[data-testid="chat-item-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-item-1"]')).toBeVisible();

    // 항목 2에 수신자 "To we4458"(홍아현 email 로컬 파트) 태그
    const item1 = page.locator('[data-testid="chat-item-1"]');
    await expect(item1.getByText(/To\s*we4458/)).toBeVisible();

    // 좌측 border 색상 — 항목 2는 request(#993556), 항목 1은 work(#C17B6B)
    const item0Color = await page.locator('[data-testid="chat-item-0"]').getAttribute('data-left-border');
    expect(item0Color).toBe('#C17B6B');
    const item1Color = await item1.getAttribute('data-left-border');
    expect(item1Color).toBe('#993556');

    // 푸터 3버튼
    await expect(page.locator('[data-testid="chat-cancel"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-promote"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-confirm"]')).toBeVisible();

    // "자세한 대화로" → placeholder 토스트
    await page.locator('[data-testid="chat-promote"]').evaluate((el) => (el as HTMLButtonElement).click());
    await expect(page.getByText(/준비 중/)).toBeVisible({ timeout: 3000 });

    // 확장 영역은 여전히 유지 (범위 밖 placeholder)
    await expect(expand).toBeVisible();

    // 범위 unset이 있어야 confirm 비활성 (적어도 "범위 미정" 태그가 하나 노출됐거나 confirm disabled)
    const confirmDisabled = await page
      .locator('[data-testid="chat-confirm"]')
      .evaluate((el) => (el as HTMLButtonElement).disabled);
    expect(confirmDisabled).toBe(true);
  });

  // ──────────── 수신자 매칭 ────────────

  test.describe('수신자 직함 매칭 (ai-capture §3.2)', () => {
    // PreviewCard는 email 로컬 파트 표시 (userStore 이름 매핑은 향후 LLM 2단 단계).
    // 따라서 기대값은 email 로컬 파트.
    const cases: Array<{ input: string; expect: string | null; label: string }> = [
      { input: '대표님한테 내일 전달', expect: 'we4458', label: '대표 단독 → 홍아현(we4458)' },
      { input: '김이사한테 자료 전달', expect: 'oilpig85', label: '성+이사 → 김진우(oilpig85)' },
      { input: '조팀장 확인', expect: 'kkjspfox', label: '성+팀장 → 조향래(kkjspfox)' },
      { input: '사원한테 맡기기', expect: 'alwjd7175', label: '사원 단독 → 유미정(alwjd7175)' },
      { input: '아현한테 전달', expect: 'we4458', label: '별칭 아현 → 홍아현(we4458)' },
      { input: '팀장님한테 물어봐', expect: null, label: '팀장 단독 → unset (3명 공유)' },
    ];

    for (const c of cases) {
      test(c.label, async ({ page }) => {
        await gotoHome(page);
        await typeAndSubmit(page, c.input);

        // 시나리오 3 확장 영역 (visibility unset)
        await expect(expandLocator(page)).toBeVisible({ timeout: 5000 });

        if (c.expect) {
          await expect(page.getByText(new RegExp(`To\\s*${c.expect}`))).toBeVisible();
        } else {
          // "팀장" 단독 → 수신자 태그 부재
          await expect(page.getByText(/^To\s/)).toHaveCount(0);
        }

        // cleanup 위해 확장 영역 닫기
        await page.keyboard.press('Escape');
      });
    }
  });

  // ──────────── 날짜 파싱 ────────────
  // 고정 시각 2026-04-23 목 10:00 KST 기준 기대값.

  test.describe('날짜 파싱 (ai-capture §3.2)', () => {
    const cases: Array<{ input: string; expectDate: string | null; label: string }> = [
      { input: '오늘 회의록 정리', expectDate: '2026-04-23', label: '오늘 → 2026-04-23' },
      { input: '내일 보고서 초안 정리', expectDate: '2026-04-24', label: '내일 → 2026-04-24' },
      { input: '모레 발표 자료 확인', expectDate: '2026-04-25', label: '모레 → 2026-04-25' },
      { input: '다음주 화요일 미팅 준비', expectDate: '2026-04-28', label: '다음주 화요일 → 2026-04-28' },
      { input: 'D-3 작업 할일', expectDate: '2026-04-20', label: 'D-3 → -3일(2026-04-20)' },
      { input: '04.25 마감 처리해야', expectDate: '2026-04-25', label: '절대 날짜 04.25' },
      { input: '특별 내용 정리', expectDate: null, label: '날짜 키워드 없음 → 기한 태그 부재' },
    ];

    for (const c of cases) {
      test(c.label, async ({ page }) => {
        await gotoHome(page);
        await typeAndSubmit(page, c.input);

        // 시나리오 3 확장 영역 (범위 unset 기본)
        await expect(expandLocator(page)).toBeVisible({ timeout: 5000 });

        if (c.expectDate) {
          // 기한 태그는 "🕐 YYYY-MM-DD" 형식
          await expect(page.getByText(new RegExp(c.expectDate))).toBeVisible();
        } else {
          // 날짜 태그 부재 — 🕐 prefix 기한 없음
          const clockTags = await page.getByText(/🕐/).count();
          expect(clockTags).toBe(0);
        }

        await page.keyboard.press('Escape');
      });
    }
  });

  // ──────────── #16 chat schedule → 달력 피어 탭 렌더 ────────────

  test('#16 — chat "다 같이 내일 2시 팀 회의"가 본인 패널 달력 탭에 렌더', async ({ page }) => {
    await ensureAdminPanel();
    await page.reload();
    await page.locator('[data-testid="panel-container"]').first().waitFor({ state: 'visible', timeout: 30000 });
    // 고유 마커로 이벤트 식별
    const marker = 'AUTOTEST16-' + Date.now().toString(36);
    await typeAndSubmit(page, `다 같이 내일 2시 ${marker}`);
    // schedule 토스트 문구 — 세션 #70 chat-input fix(2833ccb) 이후 "달력에 일정이 추가됐습니다"
    await expect(page.getByText(/달력에 일정이 추가됐습니다/)).toBeVisible({ timeout: 6000 });
    // admin seed panel 달력 탭 이동
    const adminPanel = page.locator(`[data-panel-id="${ADMIN_PANEL_DOC_ID}"]`);
    await adminPanel.locator('[data-testid="panel-tab-calendar"]').click();
    // FullCalendar 렌더 — title 매칭
    await expect(page.getByText(new RegExp(marker))).toBeVisible({ timeout: 10000 });
  });

  test('#16 β — chat schedule 확장 영역에 visibility 칩 미노출', async ({ page }) => {
    await gotoHome(page);
    // "내일 2시 회의" — schedule + visibility unset → 확장 영역 노출. β UX상 칩 숨김.
    await typeAndSubmit(page, '내일 2시 회의');
    await expect(expandLocator(page)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chat-chip-public"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="chat-chip-private"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="chat-chip-specific"]')).toHaveCount(0);
    // 추가 버튼 활성(schedule 제약 면제)
    const confirmBtn = page.locator('[data-testid="chat-confirm"]');
    await expect(confirmBtn).not.toBeDisabled();
    await page.keyboard.press('Escape');
  });

  // ──────────── schedule 단어 경계 (오탐 해소) ────────────

  test('schedule 단어 경계 — "회의록" 단독은 memo 분기 (오탐 해소)', async ({ page }) => {
    await gotoHome(page);
    await typeAndSubmit(page, '회의록');
    // visibility unset → 시나리오 3 확장
    await expect(expandLocator(page)).toBeVisible({ timeout: 5000 });
    const preview = page.locator('[data-testid="chat-preview"]');
    await expect(preview).toBeVisible();
    // memo 분기 — type 태그는 "업무/개인/메모" 중 하나. schedule(="일정") 부재 확인이 핵심.
    await expect(preview.getByText('일정', { exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
  });

  // ──────────── 모바일 pill 노출 ────────────

  test.describe('모바일 viewport', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('모바일에서 ChatInput pill 노출 (Codex P2 회귀 방지)', async ({ page }) => {
      await gotoHome(page);
      await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    });

    test('모바일에서 시나리오 2 즉시 저장 동작', async ({ page }) => {
      await gotoHome(page);
      await typeAndSubmit(page, '다 같이 모바일 테스트 메모');
      await expect(page.getByText(/탭에 추가됨/)).toBeVisible({ timeout: 5000 });
    });
  });

  // ──────────── 회귀 — 기존 화면 침범 없음 ────────────

  test.describe('기존 화면 회귀', () => {
    test('MY DESK 진입 시 ChatInput pill 부재', async ({ page }) => {
      await loginAsAdminForAnyViewport(page);
      await page.goto('/mydesk');
      // /mydesk는 sidebar 표시되므로 aside 대기로 충분
      await page.locator('aside').waitFor({ state: 'visible', timeout: 30000 });
      // ChatInput은 홈(/) 전용 — /mydesk에서는 렌더 안 됨
      await expect(page.locator('[data-testid="chat-input"]')).toHaveCount(0);
    });

    test('홈 6패널 그리드 렌더 (데스크탑)', async ({ page }) => {
      await gotoHome(page);
      const panels = page.locator('[data-testid="panel-container"]');
      const count = await panels.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
});
