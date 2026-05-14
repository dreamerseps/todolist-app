'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

process.env.JWT_ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'test-access-secret-32chars-xxxxxxxxxxx';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-32chars-xxxxxxxxxx';
process.env.CORS_ORIGIN        = 'http://localhost:5173';

const request = require('supertest');
const jwt     = require('jsonwebtoken');
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

function chk(label, actual, expected) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

const TS       = Date.now();
const EMAIL    = `test_be05_${TS}@example.com`;
const PASSWORD = 'password123';
const NAME     = 'Token Test User';

async function cleanup() {
  try {
    await pool.query("DELETE FROM users WHERE email LIKE 'test_be05_%@example.com'");
  } catch {}
}

// 테스트 전 사용자 생성 + 로그인해서 토큰 얻기
async function setup() {
  await request(app).post('/api/auth/register').send({ email: EMAIL, password: PASSWORD, name: NAME });
  const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
  return res.body.data; // { accessToken, refreshToken, user }
}

async function main() {
  console.log('\n[BE-05] 토큰 갱신·로그아웃 API\n');

  await cleanup();
  const { accessToken, refreshToken } = await setup();

  // ────────────────────────────────────────────────────────
  console.log('1. POST /api/auth/refresh — 토큰 갱신');

  await it('refreshToken 없음 → 400', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    chk('status', res.status, 400);
    chk('success', res.body.success, false);
  });

  await it('유효한 refreshToken → 200 + { accessToken }', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    chk('status', res.status, 200);
    chk('success', res.body.success, true);
    if (!res.body.data?.accessToken) throw new Error('accessToken 없음');
    const parts = res.body.data.accessToken.split('.');
    if (parts.length !== 3) throw new Error('accessToken이 JWT 형식이 아님');
  });

  await it('새 accessToken이 기존과 다를 수 있음 (재발급)', async () => {
    // 짧은 시간 간격이면 payload/exp가 같을 수 있어 구조만 확인
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    if (!res.body.data?.accessToken) throw new Error('accessToken 없음');
  });

  await it('새 accessToken으로 보호 엔드포인트 접근 가능', async () => {
    const res1 = await request(app).post('/api/auth/refresh').send({ refreshToken });
    const newToken = res1.body.data.accessToken;
    const res2 = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${newToken}`);
    // logout이 구현되어 있지 않으면 404가 아닌 다른 코드 - 여기선 authenticate 통과 여부만 확인
    if (res2.status === 401) throw new Error('새 accessToken 인증 실패');
  });

  await it('만료된 refreshToken → 401', async () => {
    const expired = jwt.sign(
      { id: 'some-id', email: 'x@x.com' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: -1 }
    );
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: expired });
    chk('status', res.status, 401);
  });

  await it('잘못된 시크릿으로 서명된 refreshToken → 401', async () => {
    const bad = jwt.sign({ id: 'x', email: 'x@x.com' }, 'wrong-secret-key-xx', { expiresIn: '7d' });
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: bad });
    chk('status', res.status, 401);
  });

  await it('조작된 토큰 문자열 → 401', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalid.token.here' });
    chk('status', res.status, 401);
  });

  await it('accessToken을 refreshToken으로 사용 → 401 (시크릿 불일치)', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: accessToken });
    chk('status', res.status, 401);
  });

  // ────────────────────────────────────────────────────────
  console.log('\n2. POST /api/auth/logout — 로그아웃');

  await it('Authorization 헤더 없음 → 401', async () => {
    const res = await request(app).post('/api/auth/logout').send();
    chk('status', res.status, 401);
  });

  await it('유효한 accessToken → 200 + { message }', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    chk('status', res.status, 200);
    chk('success', res.body.success, true);
    if (!res.body.data?.message) throw new Error('message 필드 없음');
    if (!res.body.data.message.includes('로그아웃')) throw new Error(`message: ${res.body.data.message}`);
  });

  await it('만료된 accessToken으로 logout → 401', async () => {
    const expiredAccess = jwt.sign(
      { id: 'x', email: 'x@x.com' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: -1 }
    );
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${expiredAccess}`);
    chk('status', res.status, 401);
  });

  // ────────────────────────────────────────────────────────
  await cleanup();

  console.log(`\n${'─'.repeat(45)}`);
  console.log(`결과: ${passed + failed}개 중 ${passed}개 통과, ${failed}개 실패`);
  if (failed > 0) process.exit(1);
  else console.log('모든 BE-05 검증 통과!\n');

  await pool.end();
}

main().catch(async (e) => {
  console.error('테스트 실행 오류:', e);
  await cleanup().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
