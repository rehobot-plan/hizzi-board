const { test, expect } = require('@playwright/test');

test('로그인 페이지 정상 노출', async ({ page }) => {
  await page.goto('https://hizzi-board.vercel.app/login');
  // 로그인 폼의 주요 요소(예: 이메일 입력, 비밀번호 입력, 로그인 버튼) 존재 확인
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('button')).toHaveText(/로그인|Login/i);
});
