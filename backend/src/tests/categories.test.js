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

const TS    = Date.now();
const EMAIL = `test_be07_${TS}@example.com`;
const EMAIL2 = `test_be07b_${TS}@example.com`;
const PW    = 'password123';

async function cleanup() {
  try {
    await pool.query("DELETE FROM todos WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test_be07%@example.com')");
    await pool.query("DELETE FROM categories WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test_be07%@example.com')");
    await pool.query("DELETE FROM users WHERE email LIKE 'test_be07%@example.com'");
  } catch {}
}

async function registerAndLogin(email) {
  await request(app).post('/api/auth/register').send({ email, password: PW, name: 'Cat Test' });
  const res = await request(app).post('/api/auth/login').send({ email, password: PW });
  return { token: res.body.data.accessToken, userId: res.body.data.user.id };
}

async function main() {
  console.log('\n[BE-07] 카테고리 API\n');
  await cleanup();

  const user1 = await registerAndLogin(EMAIL);
  const user2 = await registerAndLogin(EMAIL2);
  const auth1 = { Authorization: `Bearer ${user1.token}` };
  const auth2 = { Authorization: `Bearer ${user2.token}` };

  // ────────────────────────────────────────────────────────
  console.log('1. GET /api/categories — 목록 조회');

  await it('인증 없음 → 401', async () => {
    const res = await request(app).get('/api/categories');
    chk('status', res.status, 401);
  });

  await it('기본 카테고리 + 사용자 카테고리 반환', async () => {
    const res = await request(app).get('/api/categories').set(auth1);
    chk('status', res.status, 200);
    chk('success', res.body.success, true);
    if (!Array.isArray(res.body.data)) throw new Error('data가 배열이 아님');
    const defaults = res.body.data.filter(c => c.isDefault);
    if (defaults.length === 0) throw new Error('기본 카테고리가 없음');
  });

  await it('기본 카테고리는 isDefault=true', async () => {
    const res = await request(app).get('/api/categories').set(auth1);
    const defaults = res.body.data.filter(c => c.isDefault);
    const names = defaults.map(c => c.name);
    if (!names.includes('업무')) throw new Error(`기본 카테고리 '업무' 없음: ${JSON.stringify(names)}`);
  });

  // ────────────────────────────────────────────────────────
  console.log('\n2. POST /api/categories — 카테고리 생성');

  await it('인증 없음 → 401', async () => {
    const res = await request(app).post('/api/categories').send({ name: '테스트' });
    chk('status', res.status, 401);
  });

  await it('name 없음 → 400', async () => {
    const res = await request(app).post('/api/categories').set(auth1).send({});
    chk('status', res.status, 400);
  });

  await it('name 빈 문자열 → 400', async () => {
    const res = await request(app).post('/api/categories').set(auth1).send({ name: '' });
    chk('status', res.status, 400);
  });

  await it('name 50자 초과 → 400', async () => {
    const res = await request(app).post('/api/categories').set(auth1).send({ name: 'a'.repeat(51) });
    chk('status', res.status, 400);
  });

  let createdCatId;
  await it('정상 생성 → 201 + { id, name, isDefault=false }', async () => {
    const res = await request(app).post('/api/categories').set(auth1).send({ name: '나의카테고리' });
    chk('status', res.status, 201);
    chk('success', res.body.success, true);
    if (!res.body.data.id)   throw new Error('id 없음');
    chk('name', res.body.data.name, '나의카테고리');
    chk('isDefault', res.body.data.isDefault, false);
    createdCatId = res.body.data.id;
  });

  await it('목록에서 생성된 카테고리 확인', async () => {
    const res = await request(app).get('/api/categories').set(auth1);
    const found = res.body.data.find(c => c.id === createdCatId);
    if (!found) throw new Error('생성된 카테고리가 목록에 없음');
  });

  await it('다른 사용자에게는 내 카테고리 미노출', async () => {
    const res = await request(app).get('/api/categories').set(auth2);
    const found = res.body.data.find(c => c.id === createdCatId);
    if (found) throw new Error('다른 사용자에게 카테고리가 노출됨 (BR-02 위반)');
  });

  await it('name 정확히 50자 → 201', async () => {
    const res = await request(app).post('/api/categories').set(auth1).send({ name: 'a'.repeat(50) });
    chk('status', res.status, 201);
  });

  // ────────────────────────────────────────────────────────
  console.log('\n3. PATCH /api/categories/:id — 카테고리 수정');

  await it('인증 없음 → 401', async () => {
    const res = await request(app).patch(`/api/categories/${createdCatId}`).send({ name: '변경' });
    chk('status', res.status, 401);
  });

  // 기본 카테고리 id 얻기
  let defaultCatId;
  await it('기본 카테고리 수정 → 400 (BR-03)', async () => {
    const listRes = await request(app).get('/api/categories').set(auth1);
    const def = listRes.body.data.find(c => c.isDefault);
    defaultCatId = def.id;
    const res = await request(app).patch(`/api/categories/${defaultCatId}`).set(auth1).send({ name: '변경시도' });
    chk('status', res.status, 400);
  });

  await it('다른 사용자 카테고리 수정 → 403 (BR-02)', async () => {
    const res = await request(app).patch(`/api/categories/${createdCatId}`).set(auth2).send({ name: '침범' });
    chk('status', res.status, 403);
  });

  await it('name 없음 → 400', async () => {
    const res = await request(app).patch(`/api/categories/${createdCatId}`).set(auth1).send({});
    chk('status', res.status, 400);
  });

  await it('name 50자 초과 → 400', async () => {
    const res = await request(app).patch(`/api/categories/${createdCatId}`).set(auth1).send({ name: 'a'.repeat(51) });
    chk('status', res.status, 400);
  });

  await it('정상 수정 → 200 + 변경된 name', async () => {
    const res = await request(app).patch(`/api/categories/${createdCatId}`).set(auth1).send({ name: '수정된카테고리' });
    chk('status', res.status, 200);
    chk('name', res.body.data.name, '수정된카테고리');
  });

  await it('존재하지 않는 id → 404', async () => {
    const res = await request(app).patch('/api/categories/00000000-0000-0000-0000-000000000000').set(auth1).send({ name: '변경' });
    chk('status', res.status, 404);
  });

  // ────────────────────────────────────────────────────────
  console.log('\n4. DELETE /api/categories/:id — 카테고리 삭제');

  await it('인증 없음 → 401', async () => {
    const res = await request(app).delete(`/api/categories/${createdCatId}`);
    chk('status', res.status, 401);
  });

  await it('기본 카테고리 삭제 → 400 (BR-03)', async () => {
    const res = await request(app).delete(`/api/categories/${defaultCatId}`).set(auth1);
    chk('status', res.status, 400);
  });

  await it('다른 사용자 카테고리 삭제 → 403 (BR-02)', async () => {
    const res = await request(app).delete(`/api/categories/${createdCatId}`).set(auth2);
    chk('status', res.status, 403);
  });

  // 할일이 있는 카테고리 삭제 시도 (BR-08)
  await it('할일이 있는 카테고리 삭제 → 422 (BR-08)', async () => {
    // 먼저 해당 카테고리에 할일 생성
    await pool.query(
      `INSERT INTO todos (user_id, category_id, title) VALUES ($1, $2, $3)`,
      [user1.userId, createdCatId, '테스트 할일']
    );
    const res = await request(app).delete(`/api/categories/${createdCatId}`).set(auth1);
    chk('status', res.status, 422);
    if (!res.body.message?.includes('할일')) throw new Error(`메시지 오류: ${res.body.message}`);
    // 할일 정리
    await pool.query('DELETE FROM todos WHERE category_id = $1', [createdCatId]);
  });

  await it('정상 삭제 (할일 없음) → 200', async () => {
    const res = await request(app).delete(`/api/categories/${createdCatId}`).set(auth1);
    chk('status', res.status, 200);
  });

  await it('삭제 후 목록에서 미노출', async () => {
    const res = await request(app).get('/api/categories').set(auth1);
    const found = res.body.data.find(c => c.id === createdCatId);
    if (found) throw new Error('삭제 후에도 목록에 남아있음');
  });

  await it('존재하지 않는 id → 404', async () => {
    const res = await request(app).delete('/api/categories/00000000-0000-0000-0000-000000000000').set(auth1);
    chk('status', res.status, 404);
  });

  // ────────────────────────────────────────────────────────
  await cleanup();

  console.log(`\n${'─'.repeat(45)}`);
  console.log(`결과: ${passed + failed}개 중 ${passed}개 통과, ${failed}개 실패`);
  if (failed > 0) process.exit(1);
  else console.log('모든 BE-07 검증 통과!\n');

  await pool.end();
}

main().catch(async (e) => {
  console.error('테스트 실행 오류:', e);
  await cleanup().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
