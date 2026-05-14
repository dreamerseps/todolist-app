'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

process.env.JWT_ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'test-access-secret-32chars-xxxxxxxxxxx';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-32chars-xxxxxxxxxx';
process.env.CORS_ORIGIN        = 'http://localhost:5173';

const request = require('supertest');
const app     = require('../app');
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

function expect(actual, label) {
  return {
    toBe:        (v)  => { if (actual !== v)  throw new Error(`${label}: expected ${v}, got ${actual}`); },
    toEqual:     (v)  => { if (JSON.stringify(actual) !== JSON.stringify(v)) throw new Error(`${label}: not equal`); },
    toBeTruthy:  ()   => { if (!actual) throw new Error(`${label}: expected truthy, got ${actual}`); },
    toBeFalsy:   ()   => { if (actual)  throw new Error(`${label}: expected falsy, got ${actual}`); },
    toContain:   (v)  => { if (!actual.includes(v)) throw new Error(`${label}: "${actual}" doesn't include "${v}"`); },
    toHaveKey:   (k)  => { if (!(k in actual)) throw new Error(`${label}: key "${k}" not found in ${JSON.stringify(actual)}`); },
    toBeString:  ()   => { if (typeof actual !== 'string') throw new Error(`${label}: expected string, got ${typeof actual}`); },
  };
}

// 테스트용 고유 이메일 (실행마다 다름)
const TS       = Date.now();
const EMAIL    = `test_be04_${TS}@example.com`;
const PASSWORD = 'password123';
const NAME     = 'Test User';

async function cleanup() {
  try {
    await pool.query('DELETE FROM todos WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['test_be04_%@example.com']);
    await pool.query("DELETE FROM users WHERE email LIKE 'test_be04_%@example.com'");
  } catch {}
}

async function main() {
  console.log('\n[BE-04] 인증 API — 회원가입·로그인\n');

  await cleanup();

  // ────────────────────────────────────────────────────────
  console.log('1. POST /api/auth/register — 회원가입');

  await it('필수 필드 누락(email) → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ password: PASSWORD, name: NAME });
    expect(res.status, 'status').toBe(400);
    expect(res.body.success, 'success').toBe(false);
  });

  await it('필수 필드 누락(password) → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: EMAIL, name: NAME });
    expect(res.status, 'status').toBe(400);
  });

  await it('필수 필드 누락(name) → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: EMAIL, password: PASSWORD });
    expect(res.status, 'status').toBe(400);
  });

  await it('이메일 형식 오류 → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'notanemail', password: PASSWORD, name: NAME });
    expect(res.status, 'status').toBe(400);
  });

  await it('비밀번호 8자 미만 → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: EMAIL, password: 'short', name: NAME });
    expect(res.status, 'status').toBe(400);
  });

  let registeredUser;
  await it('정상 회원가입 → 201 + { id, email, name }', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: EMAIL, password: PASSWORD, name: NAME });
    expect(res.status, 'status').toBe(201);
    expect(res.body.success, 'success').toBe(true);
    expect(res.body.data, 'data').toHaveKey('id');
    expect(res.body.data, 'data').toHaveKey('email');
    expect(res.body.data, 'data').toHaveKey('name');
    expect(res.body.data.email, 'email').toBe(EMAIL);
    expect(res.body.data.name, 'name').toBe(NAME);
    if (res.body.data.password_hash !== undefined) throw new Error('password_hash가 응답에 포함됨 (보안 위반)');
    registeredUser = res.body.data;
  });

  await it('이메일 중복 등록 → 409 (BR-07)', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: EMAIL, password: PASSWORD, name: NAME });
    expect(res.status, 'status').toBe(409);
    expect(res.body.code, 'code').toBe('CONFLICT');
  });

  // ────────────────────────────────────────────────────────
  console.log('\n2. POST /api/auth/login — 로그인');

  await it('필수 필드 누락(email) → 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: PASSWORD });
    expect(res.status, 'status').toBe(400);
  });

  await it('필수 필드 누락(password) → 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL });
    expect(res.status, 'status').toBe(400);
  });

  await it('존재하지 않는 이메일 → 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nonexistent@example.com', password: PASSWORD });
    expect(res.status, 'status').toBe(401);
  });

  await it('잘못된 비밀번호 → 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'wrongpassword' });
    expect(res.status, 'status').toBe(401);
  });

  await it('정상 로그인 → 200 + { accessToken, refreshToken, user }', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
    expect(res.status, 'status').toBe(200);
    expect(res.body.success, 'success').toBe(true);
    expect(res.body.data, 'data').toHaveKey('accessToken');
    expect(res.body.data, 'data').toHaveKey('refreshToken');
    expect(res.body.data, 'data').toHaveKey('user');
    expect(res.body.data.accessToken, 'accessToken').toBeString();
    expect(res.body.data.refreshToken, 'refreshToken').toBeString();
    expect(res.body.data.user.id, 'user.id').toBe(registeredUser?.id);
    expect(res.body.data.user.email, 'user.email').toBe(EMAIL);
    expect(res.body.data.user.name, 'user.name').toBe(NAME);
    if (res.body.data.user.password_hash !== undefined) throw new Error('password_hash가 응답에 포함됨');
    // accessToken이 JWT 형식인지 확인
    const parts = res.body.data.accessToken.split('.');
    if (parts.length !== 3) throw new Error(`accessToken이 JWT 형식이 아님: ${res.body.data.accessToken}`);
  });

  await it('로그인 후 accessToken으로 /health 접근 가능', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
    const { accessToken } = loginRes.body.data;
    const res = await request(app)
      .get('/health')
      .set('Authorization', `Bearer ${accessToken}`);
    if (res.status !== 200 && res.status !== 503) throw new Error(`status ${res.status}`);
  });

  // ────────────────────────────────────────────────────────
  await cleanup();

  console.log(`\n${'─'.repeat(45)}`);
  console.log(`결과: ${passed + failed}개 중 ${passed}개 통과, ${failed}개 실패`);
  if (failed > 0) process.exit(1);
  else console.log('모든 BE-04 검증 통과!\n');

  await pool.end();
}

main().catch(async (e) => {
  console.error('테스트 실행 오류:', e);
  await cleanup().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
