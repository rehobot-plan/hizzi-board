/**
 * Playwright E2E용 일반 사용자 테스트 계정 관리 (Firebase Admin SDK)
 * - ensureRegularTestUser: 고정 이메일·비밀번호로 테스트 계정 upsert.
 *   authStore.onAuthStateChanged는 email === ADMIN_EMAIL만 role='admin'으로 세팅하므로,
 *   ADMIN_EMAIL 아닌 이메일은 자동으로 role=undefined (일반 사용자) 분기를 탄다.
 */
import * as admin from 'firebase-admin';
import * as path from 'path';

const SERVICE_ACCOUNT_PATH = path.resolve('D:/Dropbox/Dropbox/serviceAccount.json');

export const REGULAR_TEST_EMAIL = '__test_regular@company.com';
export const REGULAR_TEST_PASSWORD = 'TestRegular1234!';

let app: admin.app.App;

function getApp() {
  if (app) return app;
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  app = admin.apps.length
    ? admin.app()
    : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return app;
}

export async function ensureRegularTestUser(): Promise<void> {
  const auth = getApp().auth();
  try {
    const existing = await auth.getUserByEmail(REGULAR_TEST_EMAIL);
    // 비밀번호 재설정 (테스트 간 일관성)
    await auth.updateUser(existing.uid, { password: REGULAR_TEST_PASSWORD, disabled: false });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/user-not-found') {
      await auth.createUser({
        email: REGULAR_TEST_EMAIL,
        password: REGULAR_TEST_PASSWORD,
        displayName: '테스트일반',
      });
    } else {
      throw err;
    }
  }
}
