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
  if (actual !== expected) throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const TS       = Date.now();
const EMAIL    = `test_be06_${TS}@example.com`;
const PASSWORD = 'password123';
const NAME     = 'User Info Test';

async function cleanup() {
  try {
    await pool.query("DELETE FROM users WHERE email LIKE 'test_be06_%@example.com'");
  } catch {}
}

async function setup() {
  await request(app).post('/api/auth/register').send({ email: EMAIL, password: PASSWORD, name: NAME });
  const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
  return res.body.data.accessToken;
}

async function main() {
  console.log('\n[BE-06] 사용자 정보 API\n');
  await cleanup();
  const token = await setup();
  const auth  = { Authorization: `Bearer ${token}` };

  // ────────────────────────────────────────────────────────
  console.log('1. GET /api/users/me — 내 정보 조회');

  await it('인증 없음 → 401', async () => {
    const res = await request(app).get('/api/users/me');
    chk('status', res.status, 401);
  });

  await it('유효한 토큰 → 200 + { id, email, name, createdAt }', async () => {
    const res = await request(app).get('/api/users/me').set(auth);
    chk('status', res.status, 200);
    chk('success', res.body.success, true);
    const d = res.body.data;
    if (!d.id)        throw new Error('id 없음');
    if (!d.email)     throw new Error('email 없음');
    if (!d.name)      throw new Error('name 없음');
    if (!d.createdAt) throw new Error('createdAt 없음');
    chk('email', d.email, EMAIL);
    chk('name',  d.name,  NAME);
  });

  await it('password_hash가 응답에 포함되지 않음 (보안)', async () => {
    const res = await request(app).get('/api/users/me').set(auth);
    if ('password_hash' in res.body.data) throw new Error('password_hash 노출됨');
    if ('passwordHash'  in res.body.data) throw new Error('passwordHash 노출됨');
  });

  // ────────────────────────────────────────────────────────
  console.log('\n2. PATCH /api/users/me — 내 정보 수정');

  await it('인증 없음 → 401', async () => {
    const res = await request(app).patch('/api/users/me').send({ name: '새이름' });
    chk('status', res.status, 401);
  });

  await it('email 수정 요청 → 400 (BR-09)', async () => {
    const res = await request(app).patch('/api/users/me').set(auth)
      .send({ email: 'new@example.com' });
    chk('status', res.status, 400);
  });

  await it('수정 필드 없음 → 400', async () => {
    const res = await request(app).patch('/api/users/me').set(auth).send({});
    chk('status', res.status, 400);
  });

  await it('이름 변경 성공 → 200 + 변경된 name 반환', async () => {
    const res = await request(app).patch('/api/users/me').set(auth)
      .send({ name: '변경된이름' });
    chk('status', res.status, 200);
    chk('name', res.body.data.name, '변경된이름');
    if ('password_hash' in res.body.data) throw new Error('password_hash 노출됨');
  });

  await it('이름 빈 문자열 → 400', async () => {
    const res = await request(app).patch('/api/users/me').set(auth).send({ name: '' });
    chk('status', res.status, 400);
  });

  await it('이름 100자 초과 → 400', async () => {
    const res = await request(app).patch('/api/users/me').set(auth)
      .send({ name: 'a'.repeat(101) });
    chk('status', res.status, 400);
  });

  await it('이름 정확히 100자 → 200', async () => {
    const res = await request(app).patch('/api/users/me').set(auth)
      .send({ name: 'a'.repeat(100) });
    chk('status', res.status, 200);
    // 원래 이름으로 복구
    await request(app).patch('/api/users/me').set(auth).send({ name: NAME });
  });

  await it('비밀번호 변경 — 현재 비밀번호 오류 → 401', async () => {
    const res = await request(app).patch('/api/users/me').set(auth)
      .send({ currentPassword: 'wrongpass', newPassword: 'newpassword123' });
    chk('status', res.status, 401);
  });

  await it('비밀번호 변경 — newPassword 8자 미만 → 400', async () => {
    const res = await request(app).patch('/api/users/me').set(auth)
      .send({ currentPassword: PASSWORD, newPassword: 'short' });
    chk('status', res.status, 400);
  });

  await it('비밀번호 변경 성공 → 200', async () => {
    const newPw = 'newpassword456';
    const res = await request(app).patch('/api/users/me').set(auth)
      .send({ currentPassword: PASSWORD, newPassword: newPw });
    chk('status', res.status, 200);
    // 새 비밀번호로 로그인 확인
    const loginRes = await request(app).post('/api/auth/login').send({ email: EMAIL, password: newPw });
    chk('login status', loginRes.status, 200);
    // 기존 비밀번호로는 로그인 불가
    const failRes = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
    chk('old pw login', failRes.status, 401);
  });

  // ────────────────────────────────────────────────────────
  await cleanup();

  console.log(`\n${'─'.repeat(45)}`);
  console.log(`결과: ${passed + failed}개 중 ${passed}개 통과, ${failed}개 실패`);
  if (failed > 0) process.exit(1);
  else console.log('모든 BE-06 검증 통과!\n');

  await pool.end();
}

main().catch(async (e) => {
  console.error('테스트 실행 오류:', e);
  await cleanup().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
