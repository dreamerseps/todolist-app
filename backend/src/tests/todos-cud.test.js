'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

process.env.JWT_ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'test-access-secret-32chars-xxxxxxxxxxx';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-32chars-xxxxxxxxxx';
process.env.CORS_ORIGIN        = 'http://localhost:5173';

const request  = require('supertest');
const app      = require('../app');
const { pool } = require('../config/database');

let passed = 0;
let failed = 0;

async function it(label, fn) {
  try {
    await fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${label} — ${e.message}`);
    failed++;
  }
}

function chk(label, actual, expected) {
  if (actual !== expected)
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const TS     = Date.now();
const EMAIL  = `test_be09_${TS}@example.com`;
const EMAIL2 = `test_be09b_${TS}@example.com`;
const PW     = 'password123';

async function cleanup() {
  try {
    await pool.query("DELETE FROM todos WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test_be09%@example.com')");
    await pool.query("DELETE FROM categories WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test_be09%@example.com')");
    await pool.query("DELETE FROM users WHERE email LIKE 'test_be09%@example.com'");
  } catch {}
}

async function registerAndLogin(email) {
  await request(app).post('/api/auth/register').send({ email, password: PW, name: 'CUD Test' });
  const res = await request(app).post('/api/auth/login').send({ email, password: PW });
  return { token: res.body.data.accessToken, userId: res.body.data.user.id };
}

async function getDefaultCategoryId(token) {
  const res = await request(app).get('/api/categories').set({ Authorization: `Bearer ${token}` });
  return res.body.data.find(c => c.name === '업무').id;
}

async function main() {
  console.log('\n[BE-09] 할일 생성·수정·삭제 API\n');
  await cleanup();

  const user1 = await registerAndLogin(EMAIL);
  const user2 = await registerAndLogin(EMAIL2);
  const auth1 = { Authorization: `Bearer ${user1.token}` };
  const auth2 = { Authorization: `Bearer ${user2.token}` };
  const catId  = await getDefaultCategoryId(user1.token);
  const catId2 = await getDefaultCategoryId(user2.token);

  // ────────────────────────────────────────────────────────
  console.log('1. POST /api/todos — 할일 생성');

  await it('인증 없음 → 401', async () => {
    const res = await request(app).post('/api/todos').send({ title: '할일', categoryId: catId });
    chk('status', res.status, 401);
  });

  await it('title 없음 → 400 (BR-05)', async () => {
    const res = await request(app).post('/api/todos').set(auth1).send({ categoryId: catId });
    chk('status', res.status, 400);
  });

  await it('categoryId 없음 → 400 (BR-05)', async () => {
    const res = await request(app).post('/api/todos').set(auth1).send({ title: '할일' });
    chk('status', res.status, 400);
  });

  await it('접근 불가한 categoryId → 400 (BR-05)', async () => {
    // user2 전용 카테고리 생성 후 user1이 사용 시도
    const catRes = await request(app).post('/api/categories').set(auth2).send({ name: '비공개카테고리' });
    const privateCatId = catRes.body.data.id;
    const res = await request(app).post('/api/todos').set(auth1)
      .send({ title: '할일', categoryId: privateCatId });
    chk('status', res.status, 400);
  });

  await it('존재하지 않는 categoryId → 400', async () => {
    const res = await request(app).post('/api/todos').set(auth1)
      .send({ title: '할일', categoryId: '00000000-0000-0000-0000-000000000000' });
    chk('status', res.status, 400);
  });

  let createdTodoId;
  await it('정상 생성 → 201 + todo 객체', async () => {
    const res = await request(app).post('/api/todos').set(auth1).send({
      title: '새 할일',
      description: '설명',
      dueDate: '2026-12-31',
      categoryId: catId,
    });
    chk('status', res.status, 201);
    chk('success', res.body.success, true);
    const d = res.body.data;
    if (!d.id)       throw new Error('id 없음');
    chk('title',       d.title,       '새 할일');
    chk('description', d.description, '설명');
    chk('isCompleted', d.isCompleted, false);
    createdTodoId = d.id;
  });

  await it('기본 카테고리(업무)로 생성 가능 (BR-03)', async () => {
    const res = await request(app).post('/api/todos').set(auth1).send({
      title: '업무 할일',
      categoryId: catId,
    });
    chk('status', res.status, 201);
  });

  await it('description·dueDate 없이 생성 가능 (선택 필드)', async () => {
    const res = await request(app).post('/api/todos').set(auth1).send({
      title: '최소 할일',
      categoryId: catId,
    });
    chk('status', res.status, 201);
    if (res.body.data.dueDate !== null) throw new Error(`dueDate: ${res.body.data.dueDate}`);
  });

  // ────────────────────────────────────────────────────────
  console.log('\n2. PATCH /api/todos/:id — 할일 수정');

  await it('인증 없음 → 401', async () => {
    const res = await request(app).patch(`/api/todos/${createdTodoId}`).send({ title: '변경' });
    chk('status', res.status, 401);
  });

  await it('다른 사용자 할일 수정 → 403 (BR-02)', async () => {
    const res = await request(app).patch(`/api/todos/${createdTodoId}`).set(auth2).send({ title: '침범' });
    chk('status', res.status, 403);
  });

  await it('존재하지 않는 id → 404', async () => {
    const res = await request(app).patch('/api/todos/00000000-0000-0000-0000-000000000000').set(auth1)
      .send({ title: '변경' });
    chk('status', res.status, 404);
  });

  await it('title 수정 → 200 + 변경 반영', async () => {
    const res = await request(app).patch(`/api/todos/${createdTodoId}`).set(auth1)
      .send({ title: '수정된 할일' });
    chk('status', res.status, 200);
    chk('title', res.body.data.title, '수정된 할일');
  });

  await it('isCompleted 토글 (false→true) → 200', async () => {
    const res = await request(app).patch(`/api/todos/${createdTodoId}`).set(auth1)
      .send({ isCompleted: true });
    chk('status', res.status, 200);
    chk('isCompleted', res.body.data.isCompleted, true);
  });

  await it('isCompleted 토글 (true→false) → 200', async () => {
    const res = await request(app).patch(`/api/todos/${createdTodoId}`).set(auth1)
      .send({ isCompleted: false });
    chk('status', res.status, 200);
    chk('isCompleted', res.body.data.isCompleted, false);
  });

  await it('categoryId 수정 → 200 (기본 카테고리로 변경)', async () => {
    const listRes = await request(app).get('/api/categories').set(auth1);
    const personalCat = listRes.body.data.find(c => c.name === '개인');
    const res = await request(app).patch(`/api/todos/${createdTodoId}`).set(auth1)
      .send({ categoryId: personalCat.id });
    chk('status', res.status, 200);
    chk('categoryId', res.body.data.categoryId, personalCat.id);
  });

  await it('접근 불가한 categoryId로 수정 → 400 (BR-05)', async () => {
    const catRes = await request(app).post('/api/categories').set(auth2).send({ name: '비공개2' });
    const privateCatId = catRes.body.data.id;
    const res = await request(app).patch(`/api/todos/${createdTodoId}`).set(auth1)
      .send({ categoryId: privateCatId });
    chk('status', res.status, 400);
  });

  await it('dueDate 수정 → 200', async () => {
    const res = await request(app).patch(`/api/todos/${createdTodoId}`).set(auth1)
      .send({ dueDate: '2027-01-01' });
    chk('status', res.status, 200);
  });

  await it('부분 업데이트 — 다른 필드 유지', async () => {
    const before = (await request(app).get(`/api/todos/${createdTodoId}`).set(auth1)).body.data;
    const res = await request(app).patch(`/api/todos/${createdTodoId}`).set(auth1)
      .send({ title: '최종 제목' });
    chk('status', res.status, 200);
    chk('isCompleted', res.body.data.isCompleted, before.isCompleted);
  });

  // ────────────────────────────────────────────────────────
  console.log('\n3. DELETE /api/todos/:id — 할일 삭제');

  // user2 소유 할일 생성
  const user2TodoRes = await request(app).post('/api/todos').set(auth2)
    .send({ title: 'user2 할일', categoryId: catId2 });
  const user2TodoId = user2TodoRes.body.data.id;

  await it('인증 없음 → 401', async () => {
    const res = await request(app).delete(`/api/todos/${createdTodoId}`);
    chk('status', res.status, 401);
  });

  await it('다른 사용자 할일 삭제 → 404 (BR-02)', async () => {
    const res = await request(app).delete(`/api/todos/${user2TodoId}`).set(auth1);
    chk('status', res.status, 404);
  });

  await it('존재하지 않는 id → 404', async () => {
    const res = await request(app).delete('/api/todos/00000000-0000-0000-0000-000000000000').set(auth1);
    chk('status', res.status, 404);
  });

  await it('정상 삭제 → 200', async () => {
    const res = await request(app).delete(`/api/todos/${createdTodoId}`).set(auth1);
    chk('status', res.status, 200);
    chk('success', res.body.success, true);
  });

  await it('삭제 후 조회 → 404', async () => {
    const res = await request(app).get(`/api/todos/${createdTodoId}`).set(auth1);
    chk('status', res.status, 404);
  });

  // ────────────────────────────────────────────────────────
  await cleanup();

  console.log(`\n${'─'.repeat(45)}`);
  console.log(`결과: ${passed + failed}개 중 ${passed}개 통과, ${failed}개 실패`);
  if (failed > 0) process.exit(1);
  else console.log('모든 BE-09 검증 통과!\n');

  await pool.end();
}

main().catch(async (e) => {
  console.error('테스트 실행 오류:', e);
  await cleanup().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
