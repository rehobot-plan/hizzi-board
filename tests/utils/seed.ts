/**
 * Playwright 테스트용 시드 데이터 — Firebase Admin SDK
 * 사용: await seedTestData() / await cleanupTestData()
 */
import * as admin from 'firebase-admin';
import * as path from 'path';

const SERVICE_ACCOUNT_PATH = path.resolve('D:/Dropbox/Dropbox/serviceAccount.json');
const TEST_PREFIX = '__test_seed_';

let app: admin.app.App;

function getApp() {
  if (app) return app;
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  app = admin.apps.length
    ? admin.app()
    : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return app;
}

function getDb() {
  return getApp().firestore();
}

const now = admin.firestore.Timestamp.fromDate(new Date('2026-04-16T10:00:00+09:00'));
const earlier = admin.firestore.Timestamp.fromDate(new Date('2026-04-15T10:00:00+09:00'));

export interface SeedIds {
  requests: string[];
  comments: string[];
}

export async function seedTestData(): Promise<SeedIds> {
  const db = getDb();
  const ids: SeedIds = { requests: [], comments: [] };

  const requests = [
    {
      title: `${TEST_PREFIX}촬영 일정 조율`,
      content: '다음 주 촬영 스케줄 조율 요청합니다.',
      fromEmail: 'alwjd7175@gmail.com', fromPanelId: 'panel-1',
      toEmail: 'admin@company.com', toPanelId: 'admin',
      status: 'pending', visibleTo: [], createdAt: now,
    },
    {
      title: `${TEST_PREFIX}룩북 촬영 준비`,
      content: '룩북 촬영 소품 목록 정리해주세요.',
      fromEmail: 'admin@company.com', fromPanelId: 'admin',
      toEmail: 'oilpig85@gmail.com', toPanelId: 'panel-3',
      status: 'accepted', visibleTo: [], dueDate: '2026-04-20',
      createdAt: earlier, resolvedAt: now,
    },
    {
      title: `${TEST_PREFIX}매장 재고 확인`,
      content: '이번 달 매장 재고 현황 파악 부탁드립니다.',
      fromEmail: 'kkjspfox@naver.com', fromPanelId: 'panel-2',
      toEmail: 'admin@company.com', toPanelId: 'admin',
      status: 'rejected', rejectReason: '일정 재조율 필요',
      visibleTo: [], createdAt: earlier, resolvedAt: now,
    },
    {
      title: `${TEST_PREFIX}시즌 컬렉션 기획서`,
      content: 'S/S 시즌 기획서 초안 제출.',
      fromEmail: 'admin@company.com', fromPanelId: 'admin',
      toEmail: 'heehun96@naver.com', toPanelId: 'panel-4',
      status: 'completed', visibleTo: [], createdAt: earlier, resolvedAt: now,
    },
    {
      title: `${TEST_PREFIX}홍보 일정 변경 요청`,
      content: '홍보 촬영 날짜를 변경하고 싶습니다.',
      fromEmail: 'ektmf335@gmail.com', fromPanelId: 'panel-5',
      toEmail: 'admin@company.com', toPanelId: 'admin',
      status: 'cancel_requested',
      cancelRequestedAt: now, cancelRequestedBy: 'ektmf335@gmail.com',
      visibleTo: [], createdAt: earlier,
    },
    {
      title: `${TEST_PREFIX}디자인 시안 전달`,
      content: '패키지 디자인 시안 3종 전달.',
      fromEmail: 'admin@company.com', fromPanelId: 'admin',
      toEmail: 'we4458@naver.com', toPanelId: 'panel-6',
      status: 'cancelled', visibleTo: [], createdAt: earlier, resolvedAt: now,
    },
  ];

  for (const req of requests) {
    const ref = await db.collection('todoRequests').add(req);
    ids.requests.push(ref.id);
  }

  // 요청 2(accepted)에 댓글 3건
  const reqId = ids.requests[1];
  const comments = [
    {
      requestId: reqId, author: 'system', authorName: '시스템',
      content: '요청이 수락되었습니다.',
      type: 'system', event: 'accepted',
      createdAt: now,
    },
    {
      requestId: reqId, author: 'admin@company.com', authorName: '관리자',
      content: '촬영 장소 확정됐나요?',
      type: 'user',
      createdAt: admin.firestore.Timestamp.fromDate(new Date('2026-04-16T11:00:00+09:00')),
    },
    {
      requestId: reqId, author: 'oilpig85@gmail.com', authorName: '김진우',
      content: '네 홍대 스튜디오로 잡았어요',
      type: 'user',
      createdAt: admin.firestore.Timestamp.fromDate(new Date('2026-04-16T11:05:00+09:00')),
    },
  ];

  for (const c of comments) {
    const ref = await db.collection('comments').add(c);
    ids.comments.push(ref.id);
  }

  return ids;
}

export async function cleanupTestData(ids: SeedIds) {
  const db = getDb();
  for (const id of ids.comments) {
    await db.collection('comments').doc(id).delete().catch(() => {});
  }
  for (const id of ids.requests) {
    await db.collection('todoRequests').doc(id).delete().catch(() => {});
  }
}
