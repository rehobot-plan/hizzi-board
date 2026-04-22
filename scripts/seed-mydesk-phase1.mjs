/**
 * MY DESK Phase 1 시드 데이터 — prod 검증용
 * 사용: node scripts/seed-mydesk-phase1.mjs seed
 *       node scripts/seed-mydesk-phase1.mjs clear
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SA_PATH = resolve('D:/Dropbox/Dropbox/serviceAccount.json');
const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

const SEED_TAG = 'mydesk-phase1';

// ─── 유틸 ─────────────────────────────────────────────
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ─── 사용자 ───────────────────────────────────────────
const ME = 'oilpig85@gmail.com';
const ME_NAME = '김진우';
const ME_PANEL = 'panel-3';
const U1 = 'alwjd7175@gmail.com';
const U1_NAME = '유미정';
const U1_PANEL = 'panel-1';
const U2 = 'kkjspfox@naver.com';
const U2_NAME = '조향래';
const U2_PANEL = 'panel-2';

// ─── 시드 ─────────────────────────────────────────────
async function seed() {
  const today = todayKey();
  console.log(`\n[seed] 오늘: ${today}\n`);

  const ids = { posts: [], calendarEvents: [], todoRequests: [] };

  // posts 4건
  const posts = [
    {
      panelId: ME_PANEL, content: '오늘마감 업무A', author: ME, category: '할일',
      visibleTo: [], taskType: 'work', dueDate: today,
      starred: false, completed: false, deleted: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      seedTag: SEED_TAG,
    },
    {
      panelId: ME_PANEL, content: '오늘마감 개인', author: ME, category: '할일',
      visibleTo: [ME], taskType: 'personal', dueDate: today,
      starred: false, completed: false, deleted: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      seedTag: SEED_TAG,
    },
    {
      panelId: ME_PANEL, content: '이틀 뒤 업무', author: ME, category: '할일',
      visibleTo: [], taskType: 'work', dueDate: addDays(2),
      starred: false, completed: false, deleted: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      seedTag: SEED_TAG,
    },
    {
      panelId: ME_PANEL, content: '일주일 뒤 업무', author: ME, category: '할일',
      visibleTo: [], taskType: 'work', dueDate: addDays(7),
      starred: false, completed: false, deleted: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      seedTag: SEED_TAG,
    },
  ];

  for (const p of posts) {
    const ref = await db.collection('posts').add(p);
    ids.posts.push(ref.id);
  }

  // calendarEvents 2건
  const events = [
    {
      title: '오늘 회의', startDate: today, endDate: today,
      authorId: ME, authorName: ME_NAME, color: '#3B6D11',
      taskType: 'work', visibility: 'all',
      repeat: { type: 'none' },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      seedTag: SEED_TAG,
    },
    {
      title: '팀 미팅', startDate: addDays(3), endDate: addDays(3),
      authorId: ME, authorName: ME_NAME, color: '#3B6D11',
      taskType: 'work', visibility: 'all',
      repeat: { type: 'none' },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      seedTag: SEED_TAG,
    },
  ];

  for (const e of events) {
    const ref = await db.collection('calendarEvents').add(e);
    ids.calendarEvents.push(ref.id);
  }

  // todoRequests 2건
  const requests = [
    {
      fromEmail: U1, fromPanelId: U1_PANEL,
      toEmail: ME, toPanelId: ME_PANEL,
      title: '요청 A', content: '유미정의 요청 A입니다.',
      visibleTo: [], status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      seedTag: SEED_TAG,
    },
    {
      fromEmail: U2, fromPanelId: U2_PANEL,
      toEmail: ME, toPanelId: ME_PANEL,
      title: '요청 B', content: '조향래의 요청 B입니다.',
      visibleTo: [], status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      seedTag: SEED_TAG,
    },
  ];

  for (const r of requests) {
    const ref = await db.collection('todoRequests').add(r);
    ids.todoRequests.push(ref.id);
  }

  console.log(`[seed] 생성 완료: posts ${ids.posts.length} / calendarEvents ${ids.calendarEvents.length} / todoRequests ${ids.todoRequests.length}`);
  console.log(`[seed] 예상 카드: 할일 2 / 일정 오늘 1, 이번 주 2 / 요청 2`);
  console.log(`[seed] 시급 리스트: 오늘 할일 2 + 오늘 일정 1 + D-2 할일 1 + 미확인 요청 2 = 6건\n`);
}

// ─── 정리 ─────────────────────────────────────────────
async function clear() {
  const collections = ['posts', 'calendarEvents', 'todoRequests'];
  let total = 0;

  for (const col of collections) {
    const snap = await db.collection(col).where('seedTag', '==', SEED_TAG).get();
    let count = 0;
    for (const d of snap.docs) {
      await d.ref.delete();
      count++;
    }
    console.log(`[clear] ${col}: ${count}건 삭제`);
    total += count;
  }

  console.log(`[clear] 총 ${total}건 삭제 완료\n`);
}

// ─── 실행 ─────────────────────────────────────────────
const cmd = process.argv[2];
if (cmd === 'seed') {
  seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
} else if (cmd === 'clear') {
  clear().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
} else {
  console.log('사용법: node scripts/seed-mydesk-phase1.mjs [seed|clear]');
  process.exit(1);
}
