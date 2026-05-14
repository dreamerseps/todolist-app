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
const EMAIL  = `test_be08_${TS}@example.com`;
const EMAIL2 = `test_be08b_${TS}@example.com`;
const PW     = 'password123';

async function cleanup() {
  try {
    await pool.query("DELETE FROM todos    WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test_be08%@example.com')");
    await pool.query("DELETE FROM categories WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test_be08%@example.com')");
    await pool.query("DELETE FROM users WHERE email LIKE 'test_be08%@example.com'");
  } catch {}
}

async function registerAndLogin(email) {
  await request(app).post('/api/auth/register').send({ email, password: PW, name: 'Todo Test' });
  const res = await request(app).post('/api/auth/login').send({ email, password: PW });
  return { token: res.body.data.accessToken, userId: res.body.data.user.id };
}

async function getDefaultCategoryId(token) {
  const res = await request(app).get('/api/categories').set({ Authorization: `Bearer ${token}` });
  return res.body.data.find(c => c.name === '업무').id;
}

async function insertTodo(userId, categoryId, overrides = {}) {
  const { rows } = await pool.query(
    `INSERT INTO todos (user_id, category_id, title, description, due_date, is_completed)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      userId,
      categoryId,
      overrides.title       ?? '테스트 할일',
      overrides.description ?? null,
      overrides.due_date    ?? null,
      overrides.is_completed ?? false,
    ]
  );
  return rows[0].id;
}

async function main() {
  console.log('\n[BE-08] 할일 조회 API\n');
  await cleanup();

  const user1 = await registerAndLogin(EMAIL);
  const user2 = await registerAndLogin(EMAIL2);
  const auth1 = { Authorization: `Bearer ${user1.token}` };
  const auth2 = { Authorization: `Bearer ${user2.token}` };

  const catId = await getDefaultCategoryId(user1.token);

  // 테스트용 할일 생성
  const todo1 = await insertTodo(user1.userId, catId, { title: '할일A', due_date: '2026-06-01', is_completed: false });
  const todo2 = await insertTodo(user1.userId, catId, { title: '할일B', due_date: '2026-06-15', is_completed: true });
  const todo3 = await insertTodo(user1.userId, catId, { title: '할일C', due_date: '2026-07-01', is_completed: false });
  const todo4 = await insertTodo(user1.userId, catId, { title: '할일D (due_date 없음)', is_completed: false });
  // user2 할일 (user1에게 안 보여야 함)
  const catId2 = await getDefaultCategoryId(user2.token);
  const todo5 = await insertTodo(user2.userId, catId2, { title: 'user2 할일' });

  // ────────────────────────────────────────────────────────
  console.log('1. GET /api/todos — 목록 조회');

  await it('인증 없음 → 401', async () => {
    const res = await request(app).get('/api/todos');
    chk('status', res.status, 401);
  });

  await it('기본 목록 → 200 + pagination 메타', async () => {
    const res = await request(app).get('/api/todos').set(auth1);
    chk('status', res.status, 200);
    chk('success', res.body.success, true);
    const d = res.body.data;
    if (!Array.isArray(d.todos))      throw new Error('todos 배열 없음');
    if (typeof d.total !== 'number')  throw new Error('total 숫자 아님');
    if (typeof d.page !== 'number')   throw new Error('page 숫자 아님');
    if (typeof d.pageSize !== 'number') throw new Error('pageSize 숫자 아님');
    if (typeof d.totalPages !== 'number') throw new Error('totalPages 숫자 아님');
  });

  await it('자기 할일만 반환 (BR-02)', async () => {
    const res = await request(app).get('/api/todos').set(auth1);
    const ids = res.body.data.todos.map(t => t.id);
    if (ids.includes(todo5)) throw new Error('다른 사용자 할일이 포함됨');
    if (!ids.includes(todo1)) throw new Error('내 할일이 없음');
  });

  await it('할일에 categoryName 포함', async () => {
    const res = await request(app).get('/api/todos').set(auth1);
    const todo = res.body.data.todos[0];
    if (!todo.categoryName) throw new Error('categoryName 없음');
  });

  await it('total이 실제 건수와 일치', async () => {
    const res = await request(app).get('/api/todos').set(auth1);
    chk('total', res.body.data.total, 4); // user1 할일 4개
  });

  await it('is_completed 필터 (false만)', async () => {
    const res = await request(app).get('/api/todos?is_completed=false').set(auth1);
    chk('status', res.status, 200);
    const todos = res.body.data.todos;
    if (todos.some(t => t.isCompleted !== false)) throw new Error('완료 할일이 포함됨');
    chk('total', res.body.data.total, 3);
  });

  await it('is_completed 필터 (true만)', async () => {
    const res = await request(app).get('/api/todos?is_completed=true').set(auth1);
    const todos = res.body.data.todos;
    if (todos.some(t => t.isCompleted !== true)) throw new Error('미완료 할일이 포함됨');
    chk('total', res.body.data.total, 1);
  });

  await it('from/to 기간 필터', async () => {
    const res = await request(app).get('/api/todos?from=2026-06-01&to=2026-06-30').set(auth1);
    chk('status', res.status, 200);
    const todos = res.body.data.todos;
    if (todos.length !== 2) throw new Error(`기간 필터 결과 ${todos.length}건 (예상 2건)`);
  });

  await it('from > to → 400', async () => {
    const res = await request(app).get('/api/todos?from=2026-07-01&to=2026-06-01').set(auth1);
    chk('status', res.status, 400);
  });

  await it('category_id 필터', async () => {
    const res = await request(app).get(`/api/todos?category_id=${catId}`).set(auth1);
    chk('status', res.status, 200);
    if (res.body.data.todos.length === 0) throw new Error('카테고리 필터 결과 0건');
  });

  await it('sort=due_date_asc — due_date 없는 항목은 마지막', async () => {
    const res = await request(app).get('/api/todos?sort=due_date_asc').set(auth1);
    const todos = res.body.data.todos;
    const lastTodo = todos[todos.length - 1];
    if (lastTodo.dueDate !== null) throw new Error('due_date 없는 항목이 마지막이 아님');
  });

  await it('sort=created_at_desc — 기본 정렬', async () => {
    const res = await request(app).get('/api/todos?sort=created_at_desc').set(auth1);
    chk('status', res.status, 200);
    if (res.body.data.todos.length === 0) throw new Error('결과 없음');
  });

  await it('페이지네이션 — limit=2, page=1', async () => {
    const res = await request(app).get('/api/todos?limit=2&page=1').set(auth1);
    chk('pageSize', res.body.data.pageSize, 2);
    chk('page', res.body.data.page, 1);
    if (res.body.data.todos.length !== 2) throw new Error(`결과 ${res.body.data.todos.length}건 (예상 2건)`);
    chk('total', res.body.data.total, 4);
    chk('totalPages', res.body.data.totalPages, 2);
  });

  await it('페이지네이션 — page=2 결과', async () => {
    const res = await request(app).get('/api/todos?limit=2&page=2').set(auth1);
    if (res.body.data.todos.length !== 2) throw new Error(`결과 ${res.body.data.todos.length}건 (예상 2건)`);
    chk('page', res.body.data.page, 2);
  });

  await it('limit 최대 100 초과 시 100으로 제한', async () => {
    const res = await request(app).get('/api/todos?limit=999').set(auth1);
    chk('status', res.status, 200);
    if (res.body.data.pageSize > 100) throw new Error(`pageSize ${res.body.data.pageSize} > 100`);
  });

  // ────────────────────────────────────────────────────────
  console.log('\n2. GET /api/todos/:id — 단건 조회');

  await it('인증 없음 → 401', async () => {
    const res = await request(app).get(`/api/todos/${todo1}`);
    chk('status', res.status, 401);
  });

  await it('내 할일 조회 → 200 + todo 객체', async () => {
    const res = await request(app).get(`/api/todos/${todo1}`).set(auth1);
    chk('status', res.status, 200);
    chk('id', res.body.data.id, todo1);
    if (!res.body.data.categoryName) throw new Error('categoryName 없음');
  });

  await it('다른 사용자 할일 조회 → 404 (BR-02)', async () => {
    const res = await request(app).get(`/api/todos/${todo5}`).set(auth1);
    chk('status', res.status, 404);
  });

  await it('존재하지 않는 id → 404', async () => {
    const res = await request(app).get('/api/todos/00000000-0000-0000-0000-000000000000').set(auth1);
    chk('status', res.status, 404);
  });

  await it('user2 자신의 할일은 조회 가능', async () => {
    const res = await request(app).get(`/api/todos/${todo5}`).set(auth2);
    chk('status', res.status, 200);
    chk('id', res.body.data.id, todo5);
  });

  // ────────────────────────────────────────────────────────
  await cleanup();

  console.log(`\n${'─'.repeat(45)}`);
  console.log(`결과: ${passed + failed}개 중 ${passed}개 통과, ${failed}개 실패`);
  if (failed > 0) process.exit(1);
  else console.log('모든 BE-08 검증 통과!\n');

  await pool.end();
}

main().catch(async (e) => {
  console.error('테스트 실행 오류:', e);
  await cleanup().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
