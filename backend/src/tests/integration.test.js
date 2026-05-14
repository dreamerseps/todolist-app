'use strict';

/**
 * BE-10: 백엔드 통합 검증
 * 전체 사용자 시나리오 + 비즈니스 규칙(BR-02, 05, 07, 08, 09) 검증
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

process.env.JWT_ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'test-access-secret-32chars-xxxxxxxxxxx';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-32chars-xxxxxxxxxx';
process.env.CORS_ORIGIN        = 'http://localhost:5173';

const request  = require('supertest');
const jwt      = require('jsonwebtoken');
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
const EMAIL  = `intg_${TS}@example.com`;
const EMAIL2 = `intg2_${TS}@example.com`;
const PW     = 'password123';

async function cleanup() {
  try {
    await pool.query("DELETE FROM todos    WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'intg%@example.com')");
    await pool.query("DELETE FROM categories WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'intg%@example.com')");
    await pool.query("DELETE FROM users WHERE email LIKE 'intg%@example.com'");
  } catch {}
}

async function main() {
  console.log('\n[BE-10] 백엔드 통합 검증\n');
  await cleanup();

  // ════════════════════════════════════════════════════════
  console.log('── SCN-01: 회원가입 → 로그인 → 할일 CRUD → 로그아웃 전체 흐름 ──\n');

  let accessToken, refreshToken, userId;
  let defaultCatId, customCatId, todoId;

  await it('1-1. 회원가입 → 201 + { id, email, name }', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email: EMAIL, password: PW, name: '통합테스트유저' });
    chk('status', res.status, 201);
    if (!res.body.data.id) throw new Error('id 없음');
    userId = res.body.data.id;
  });

  await it('1-2. 로그인 → 200 + accessToken + refreshToken', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: EMAIL, password: PW });
    chk('status', res.status, 200);
    if (!res.body.data.accessToken)  throw new Error('accessToken 없음');
    if (!res.body.data.refreshToken) throw new Error('refreshToken 없음');
    accessToken  = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  const auth = () => ({ Authorization: `Bearer ${accessToken}` });

  await it('1-3. GET /api/categories → 기본 카테고리 포함', async () => {
    const res = await request(app).get('/api/categories').set(auth());
    chk('status', res.status, 200);
    const defaults = res.body.data.filter(c => c.isDefault);
    if (defaults.length === 0) throw new Error('기본 카테고리 없음');
    defaultCatId = defaults.find(c => c.name === '업무').id;
  });

  await it('1-4. POST /api/categories → 사용자 정의 카테고리 생성', async () => {
    const res = await request(app).post('/api/categories').set(auth())
      .send({ name: '내카테고리' });
    chk('status', res.status, 201);
    customCatId = res.body.data.id;
  });

  await it('1-5. POST /api/todos → 할일 생성 (201)', async () => {
    const res = await request(app).post('/api/todos').set(auth()).send({
      title:      '첫 번째 할일',
      description: '설명입니다',
      dueDate:    '2026-12-31',
      categoryId: defaultCatId,
    });
    chk('status', res.status, 201);
    chk('title', res.body.data.title, '첫 번째 할일');
    todoId = res.body.data.id;
  });

  await it('1-6. GET /api/todos → 목록 조회 (페이지네이션 메타 포함)', async () => {
    const res = await request(app).get('/api/todos').set(auth());
    chk('status', res.status, 200);
    const d = res.body.data;
    if (d.total === 0) throw new Error('total=0');
    if (!Array.isArray(d.todos)) throw new Error('todos 배열 아님');
    if (typeof d.totalPages !== 'number') throw new Error('totalPages 없음');
  });

  await it('1-7. GET /api/todos/:id → 단건 조회', async () => {
    const res = await request(app).get(`/api/todos/${todoId}`).set(auth());
    chk('status', res.status, 200);
    chk('id', res.body.data.id, todoId);
  });

  await it('1-8. PATCH /api/todos/:id → 완료 토글 (isCompleted: true)', async () => {
    const res = await request(app).patch(`/api/todos/${todoId}`).set(auth())
      .send({ isCompleted: true });
    chk('status', res.status, 200);
    chk('isCompleted', res.body.data.isCompleted, true);
  });

  await it('1-9. PATCH /api/todos/:id → 제목·카테고리 수정', async () => {
    const res = await request(app).patch(`/api/todos/${todoId}`).set(auth())
      .send({ title: '수정된 할일', categoryId: customCatId });
    chk('status', res.status, 200);
    chk('title', res.body.data.title, '수정된 할일');
    chk('categoryId', res.body.data.categoryId, customCatId);
  });

  await it('1-10. DELETE /api/todos/:id → 삭제 (200)', async () => {
    const res = await request(app).delete(`/api/todos/${todoId}`).set(auth());
    chk('status', res.status, 200);
  });

  await it('1-11. 삭제 후 GET /api/todos/:id → 404', async () => {
    const res = await request(app).get(`/api/todos/${todoId}`).set(auth());
    chk('status', res.status, 404);
  });

  await it('1-12. GET /api/users/me → 내 정보 조회', async () => {
    const res = await request(app).get('/api/users/me').set(auth());
    chk('status', res.status, 200);
    chk('email', res.body.data.email, EMAIL);
    if ('password_hash' in res.body.data) throw new Error('password_hash 노출');
  });

  await it('1-13. PATCH /api/users/me → 이름 수정', async () => {
    const res = await request(app).patch('/api/users/me').set(auth())
      .send({ name: '수정된이름' });
    chk('status', res.status, 200);
    chk('name', res.body.data.name, '수정된이름');
  });

  await it('1-14. POST /api/auth/logout → 200', async () => {
    const res = await request(app).post('/api/auth/logout').set(auth());
    chk('status', res.status, 200);
    if (!res.body.data.message.includes('로그아웃')) throw new Error(`message: ${res.body.data.message}`);
  });

  // ════════════════════════════════════════════════════════
  console.log('\n── SCN-02: 토큰 갱신 흐름 ──\n');

  await it('2-1. 유효한 refreshToken → 새 accessToken 발급', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    chk('status', res.status, 200);
    if (!res.body.data.accessToken) throw new Error('accessToken 없음');
    // 새 accessToken으로 재로그인 없이 인증 가능
    accessToken = res.body.data.accessToken;
  });

  await it('2-2. 새 accessToken으로 /api/users/me 접근 가능', async () => {
    const res = await request(app).get('/api/users/me').set(auth());
    chk('status', res.status, 200);
  });

  await it('2-3. 만료된 accessToken → 401', async () => {
    const expired = jwt.sign({ id: userId, email: EMAIL }, process.env.JWT_ACCESS_SECRET, { expiresIn: -1 });
    const res = await request(app).get('/api/users/me')
      .set({ Authorization: `Bearer ${expired}` });
    chk('status', res.status, 401);
  });

  await it('2-4. 만료된 refreshToken → 401', async () => {
    const expired = jwt.sign({ id: userId, email: EMAIL }, process.env.JWT_REFRESH_SECRET, { expiresIn: -1 });
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: expired });
    chk('status', res.status, 401);
  });

  // ════════════════════════════════════════════════════════
  console.log('\n── SCN-03: BR-02 — 다른 사용자 데이터 접근 차단 ──\n');

  // user2 등록 + 로그인
  await request(app).post('/api/auth/register').send({ email: EMAIL2, password: PW, name: 'user2' });
  const loginRes2 = await request(app).post('/api/auth/login').send({ email: EMAIL2, password: PW });
  const token2 = loginRes2.body.data.accessToken;
  const auth2  = { Authorization: `Bearer ${token2}` };

  // user1 할일 재생성
  const catRes1 = await request(app).get('/api/categories').set(auth());
  const defCat1 = catRes1.body.data.find(c => c.isDefault).id;
  const todoRes = await request(app).post('/api/todos').set(auth())
    .send({ title: 'user1 할일', categoryId: defCat1 });
  const user1TodoId = todoRes.body.data.id;

  // user1 사용자 정의 카테고리 재생성
  const catCreateRes = await request(app).post('/api/categories').set(auth()).send({ name: '보안카테고리' });
  const user1CatId = catCreateRes.body.data.id;

  await it('3-1. user2가 user1 할일 조회 → 404', async () => {
    const res = await request(app).get(`/api/todos/${user1TodoId}`).set(auth2);
    chk('status', res.status, 404);
  });

  await it('3-2. user2가 user1 할일 수정 → 403', async () => {
    const res = await request(app).patch(`/api/todos/${user1TodoId}`).set(auth2)
      .send({ title: '침범' });
    chk('status', res.status, 403);
  });

  await it('3-3. user2가 user1 할일 삭제 → 404', async () => {
    const res = await request(app).delete(`/api/todos/${user1TodoId}`).set(auth2);
    chk('status', res.status, 404);
  });

  await it('3-4. user2가 user1 카테고리 수정 → 403', async () => {
    const res = await request(app).patch(`/api/categories/${user1CatId}`).set(auth2)
      .send({ name: '침범' });
    chk('status', res.status, 403);
  });

  await it('3-5. user2가 user1 카테고리 삭제 → 403', async () => {
    const res = await request(app).delete(`/api/categories/${user1CatId}`).set(auth2);
    chk('status', res.status, 403);
  });

  await it('3-6. user2 할일 목록에 user1 할일 미포함', async () => {
    const res = await request(app).get('/api/todos').set(auth2);
    const ids = res.body.data.todos.map(t => t.id);
    if (ids.includes(user1TodoId)) throw new Error('user1 할일이 user2 목록에 포함됨');
  });

  // ════════════════════════════════════════════════════════
  console.log('\n── SCN-04: BR-05 — categoryId 없는 할일 등록 시 400 ──\n');

  await it('4-1. categoryId 미전달 → 400', async () => {
    const res = await request(app).post('/api/todos').set(auth())
      .send({ title: '카테고리 없음' });
    chk('status', res.status, 400);
  });

  await it('4-2. 존재하지 않는 categoryId → 400', async () => {
    const res = await request(app).post('/api/todos').set(auth())
      .send({ title: '할일', categoryId: '00000000-0000-0000-0000-000000000000' });
    chk('status', res.status, 400);
  });

  await it('4-3. 다른 사용자 카테고리 지정 → 400', async () => {
    const catRes2 = await request(app).get('/api/categories').set(auth2);
    const cat2 = catRes2.body.data.find(c => !c.isDefault);
    // user2 전용 카테고리 없으면 생성
    let privateCatId;
    if (cat2) {
      privateCatId = cat2.id;
    } else {
      const r = await request(app).post('/api/categories').set(auth2).send({ name: '비공개' });
      privateCatId = r.body.data.id;
    }
    const res = await request(app).post('/api/todos').set(auth())
      .send({ title: '할일', categoryId: privateCatId });
    chk('status', res.status, 400);
  });

  // ════════════════════════════════════════════════════════
  console.log('\n── SCN-05: BR-07 — 이메일 중복 가입 시 409 ──\n');

  await it('5-1. 동일 이메일 재가입 → 409', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email: EMAIL, password: PW, name: '중복유저' });
    chk('status', res.status, 409);
    chk('code', res.body.code, 'CONFLICT');
  });

  await it('5-2. 409 응답에 에러 메시지 포함', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email: EMAIL, password: PW, name: '중복유저' });
    if (!res.body.message) throw new Error('message 없음');
  });

  // ════════════════════════════════════════════════════════
  console.log('\n── SCN-06: BR-08 — 할일이 있는 카테고리 삭제 시 422 ──\n');

  // 카테고리 + 해당 카테고리의 할일 생성
  const br08CatRes = await request(app).post('/api/categories').set(auth()).send({ name: 'BR08테스트' });
  const br08CatId = br08CatRes.body.data.id;
  await request(app).post('/api/todos').set(auth())
    .send({ title: 'BR08할일', categoryId: br08CatId });

  await it('6-1. 할일이 있는 카테고리 삭제 → 422', async () => {
    const res = await request(app).delete(`/api/categories/${br08CatId}`).set(auth());
    chk('status', res.status, 422);
  });

  await it('6-2. 422 응답 메시지에 "할일" 포함', async () => {
    const res = await request(app).delete(`/api/categories/${br08CatId}`).set(auth());
    if (!res.body.message?.includes('할일')) throw new Error(`message: ${res.body.message}`);
  });

  // ════════════════════════════════════════════════════════
  console.log('\n── SCN-07: BR-09 — 이메일 변경 불가 ──\n');

  await it('7-1. PATCH /api/users/me에 email 포함 → 400', async () => {
    const res = await request(app).patch('/api/users/me').set(auth())
      .send({ email: 'newemail@example.com' });
    chk('status', res.status, 400);
  });

  await it('7-2. 이메일이 변경되지 않음 확인', async () => {
    const res = await request(app).get('/api/users/me').set(auth());
    chk('email', res.body.data.email, EMAIL);
  });

  // ════════════════════════════════════════════════════════
  console.log('\n── SCN-08: 미인증 요청 전체 차단 (BR-01) ──\n');

  const protectedEndpoints = [
    { method: 'get',    path: '/api/users/me' },
    { method: 'patch',  path: '/api/users/me' },
    { method: 'get',    path: '/api/categories' },
    { method: 'post',   path: '/api/categories' },
    { method: 'get',    path: '/api/todos' },
    { method: 'post',   path: '/api/todos' },
    { method: 'post',   path: '/api/auth/logout' },
  ];

  for (const { method, path } of protectedEndpoints) {
    await it(`${method.toUpperCase()} ${path} — 미인증 → 401`, async () => {
      const res = await request(app)[method](path);
      if (res.status !== 401) throw new Error(`status ${res.status}`);
    });
  }

  // ════════════════════════════════════════════════════════
  console.log('\n── SCN-09: GET /health — 서버 상태 확인 ──\n');

  await it('9-1. GET /health → 200 (DB 연결 정상)', async () => {
    const res = await request(app).get('/health');
    if (res.status !== 200 && res.status !== 503) throw new Error(`status ${res.status}`);
    if (!('success' in res.body)) throw new Error('success 필드 없음');
    if (res.status !== 200) throw new Error('DB 연결 실패 (서버 환경 문제)');
  });

  // ════════════════════════════════════════════════════════
  await cleanup();

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`[BE-10] 통합 검증 결과: ${passed + failed}개 중 ${passed}개 통과, ${failed}개 실패`);
  console.log('═'.repeat(50));

  if (failed > 0) process.exit(1);
  else console.log('모든 BE-10 통합 검증 통과!\n');

  await pool.end();
}

main().catch(async (e) => {
  console.error('통합 테스트 실행 오류:', e);
  await cleanup().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
