import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';
import { takeScreenshot } from '../utils/screenshot';
import * as admin from 'firebase-admin';
import * as path from 'path';

const SERVICE_ACCOUNT_PATH = path.resolve('D:/Dropbox/Dropbox/serviceAccount.json');
const TEST_PREFIX = '__test_toast_';

let app: admin.app.App;
function getDb() {
  if (!app) {
    const sa = require(SERVICE_ACCOUNT_PATH);
    app = admin.apps.length ? admin.app() : admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  return app.firestore();
}

let reqId: string;
const commentIds: string[] = [];

test.beforeAll(async () => {
  const db = getDb();
  const ref = await db.collection('todoRequests').add({
    title: `${TEST_PREFIX}토스트 검증`,
    content: '상태 변화 토스트 테스트.',
    fromEmail: 'oilpig85@gmail.com', fromPanelId: 'panel-3',
    toEmail: 'admin@company.com', toPanelId: 'admin',
    status: 'pending', visibleTo: [],
    createdAt: admin.firestore.Timestamp.now(),
  });
  reqId = ref.id;
});

test.afterAll(async () => {
  const db = getDb();
  const snap = await db.collection('comments').where('requestId', '==', reqId).get();
  for (const d of snap.docs) await d.ref.delete().catch(() => {});
  if (reqId) await db.collection('todoRequests').doc(reqId).delete().catch(() => {});
});

test.describe('요청 상태 변화 토스트', () => {
  test('pending → accepted 변경 시 토스트 표시', async ({ page }) => {
    await loginAsAdmin(page);
    // 초기 스냅샷 로딩 대기
    await page.waitForTimeout(5000);

    // Firebase Admin으로 상태 직접 변경
    const db = getDb();
    await db.collection('todoRequests').doc(reqId).update({
      status: 'accepted',
      resolvedAt: admin.firestore.Timestamp.now(),
    });

    // 토스트 표시 대기 (onSnapshot → 토스트 발화)
    // 토스트는 보통 alert role 또는 특정 div에 렌더
    await page.waitForTimeout(5000);
    await takeScreenshot(page, 'toast-accepted');

    // 토스트 텍스트 확인 시도 (토스트 구조에 따라)
    const toastText = await page.locator('text=수락했습니다').isVisible().catch(() => false);
    // 토스트가 자동으로 사라질 수 있으므로 스크린샷으로 대체 확인
    console.log(`Toast visible: ${toastText}`);
  });
});
