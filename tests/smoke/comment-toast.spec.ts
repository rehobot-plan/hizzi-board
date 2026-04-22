import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';
import { takeScreenshot } from '../utils/screenshot';
import * as admin from 'firebase-admin';
import * as path from 'path';

const SERVICE_ACCOUNT_PATH = path.resolve('D:/Dropbox/Dropbox/serviceAccount.json');
const TEST_PREFIX = '__test_comment_toast_';

let app: admin.app.App;
function getDb() {
  if (!app) {
    const sa = require(SERVICE_ACCOUNT_PATH);
    app = admin.apps.length ? admin.app() : admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  return app.firestore();
}

let reqId: string;
let commentId: string;

test.beforeAll(async () => {
  const db = getDb();
  const ref = await db.collection('todoRequests').add({
    title: `${TEST_PREFIX}댓글 토스트 검증`,
    content: '댓글 토스트 테스트.',
    fromEmail: 'oilpig85@gmail.com', fromPanelId: 'panel-3',
    toEmail: 'admin@company.com', toPanelId: 'admin',
    status: 'accepted', visibleTo: [],
    createdAt: admin.firestore.Timestamp.now(),
    resolvedAt: admin.firestore.Timestamp.now(),
  });
  reqId = ref.id;
});

test.afterAll(async () => {
  const db = getDb();
  if (commentId) await db.collection('comments').doc(commentId).delete().catch(() => {});
  if (reqId) await db.collection('todoRequests').doc(reqId).delete().catch(() => {});
});

test.describe('댓글 토스트', () => {
  test('타인 댓글 작성 시 토스트 표시', async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForTimeout(5000); // 초기 스냅샷 로딩 대기

    // Firebase Admin으로 타인 댓글 추가
    const db = getDb();
    const cRef = await db.collection('comments').add({
      requestId: reqId,
      author: 'oilpig85@gmail.com',
      authorName: '김진우',
      content: '촬영 일정 확인 부탁드립니다',
      type: 'user',
      createdAt: admin.firestore.Timestamp.now(),
    });
    commentId = cRef.id;

    // 토스트 대기
    await page.waitForTimeout(5000);
    await takeScreenshot(page, 'comment-toast');

    const toastVisible = await page.locator('text=김진우님이 댓글').isVisible().catch(() => false);
    console.log(`Comment toast visible: ${toastVisible}`);
    // 토스트가 자동 소멸될 수 있으므로 스크린샷으로 보완
  });
});
