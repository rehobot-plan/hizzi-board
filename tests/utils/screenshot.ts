import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots', 'smoke');

export async function takeScreenshot(page: Page, name: string): Promise<string> {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(SCREENSHOT_DIR, `${name}_${timestamp}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}
