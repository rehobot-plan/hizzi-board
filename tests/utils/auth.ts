import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('admin@company.com');
  await page.locator('input[type="password"]').fill('admin1234!');
  await page.getByRole('button', { name: '로그인' }).click();
  await page.locator('aside').waitFor({ state: 'visible', timeout: 30000 });
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.locator('aside').waitFor({ state: 'visible', timeout: 30000 });
}
