import { test as setup, expect } from '@playwright/test';

const accounts = [
  {
    email: 'admin@company.com',
    password: 'admin1234!',
    storageState: 'tests/.auth/admin.json',
  },
];

for (const account of accounts) {
  setup(`authenticate ${account.email}`, async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('이메일').fill(account.email);
    await page.getByPlaceholder('비밀번호').fill(account.password);
    await page.getByRole('button', { name: '로그인' }).click();

    // Firebase Auth 완료 대기: 메인 페이지 사이드바 로딩까지
    await page.waitForURL('/', { timeout: 15000 });
    await page.locator('text=HIZZI BOARD').first().waitFor({ state: 'visible', timeout: 15000 });

    await page.context().storageState({ path: account.storageState });
  });
}
