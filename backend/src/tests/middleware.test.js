'use strict';

process.env.JWT_ACCESS_SECRET  = 'test-access-secret-32chars-xxxxxxxxxxx';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32chars-xxxxxxxxxx';
process.env.CORS_ORIGIN        = 'http://localhost:5173';
process.env.POSTGRES_CONNECTION_STRING = 'postgresql://postgres:postgres@localhost:5432/postgres';

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const express = require('express');

let passed = 0;
let failed = 0;

function log(label, ok, detail = '') {
  if (ok) { console.log(`  ✓ ${label}`); passed++; }
  else     { console.error(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}

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

function makeToken(payload, secret, opts = {}) {
  return jwt.sign(payload, secret, opts);
}

async function main() {
  console.log('\n[BE-03] 미들웨어 검증\n');

  const {
    AppError, BadRequestError, UnauthorizedError,
    ForbiddenError, NotFoundError, ConflictError,
  } = require('../utils/errors');
  const errorHandler = require('../middlewares/errorHandler');
  const authenticate = require('../middlewares/authenticate');

  // ── 에러 핸들러 테스트용 앱 ──────────────────────────────
  function buildTestApp() {
    const app = express();
    app.use(express.json());

    app.get('/ok',          (_req, res) => res.json({ success: true, data: 'ok' }));
    app.get('/bad-request', () => { throw new BadRequestError('잘못된 요청'); });
    app.get('/unauthorized',() => { throw new UnauthorizedError('인증 필요'); });
    app.get('/forbidden',   () => { throw new ForbiddenError('권한 없음'); });
    app.get('/not-found',   () => { throw new NotFoundError('없음'); });
    app.get('/conflict',    () => { throw new ConflictError('충돌'); });
    app.get('/app-error',   () => { throw new AppError('커스텀', 422, 'UNPROCESSABLE'); });
    app.get('/unknown',     () => { throw new Error('예상치 못한 에러'); });
    app.get('/async-error', async () => { throw new BadRequestError('async 에러'); });
    app.use(errorHandler);
    return app;
  }

  // ── authenticate 테스트용 앱 ─────────────────────────────
  function buildAuthApp() {
    const app = express();
    app.use(express.json());
    app.get('/protected', authenticate, (req, res) => {
      res.json({ success: true, user: req.user });
    });
    app.use(errorHandler);
    return app;
  }

  const testApp = buildTestApp();
  const authApp = buildAuthApp();

  // ────────────────────────────────────────────────────────
  console.log('1. errorHandler — 표준 응답 포맷');

  await it('200 정상 응답은 핸들러 미통과', async () => {
    const res = await request(testApp).get('/ok');
    if (res.status !== 200) throw new Error(`status ${res.status}`);
    if (!res.body.success) throw new Error('success != true');
  });

  await it('BadRequestError → 400 + code:BAD_REQUEST', async () => {
    const res = await request(testApp).get('/bad-request');
    if (res.status !== 400) throw new Error(`status ${res.status}`);
    if (res.body.success !== false) throw new Error('success != false');
    if (res.body.code !== 'BAD_REQUEST') throw new Error(`code: ${res.body.code}`);
    if (!res.body.message) throw new Error('message 없음');
  });

  await it('UnauthorizedError → 401 + code:UNAUTHORIZED', async () => {
    const res = await request(testApp).get('/unauthorized');
    if (res.status !== 401) throw new Error(`status ${res.status}`);
    if (res.body.code !== 'UNAUTHORIZED') throw new Error(`code: ${res.body.code}`);
  });

  await it('ForbiddenError → 403 + code:FORBIDDEN', async () => {
    const res = await request(testApp).get('/forbidden');
    if (res.status !== 403) throw new Error(`status ${res.status}`);
    if (res.body.code !== 'FORBIDDEN') throw new Error(`code: ${res.body.code}`);
  });

  await it('NotFoundError → 404 + code:NOT_FOUND', async () => {
    const res = await request(testApp).get('/not-found');
    if (res.status !== 404) throw new Error(`status ${res.status}`);
    if (res.body.code !== 'NOT_FOUND') throw new Error(`code: ${res.body.code}`);
  });

  await it('ConflictError → 409 + code:CONFLICT', async () => {
    const res = await request(testApp).get('/conflict');
    if (res.status !== 409) throw new Error(`status ${res.status}`);
    if (res.body.code !== 'CONFLICT') throw new Error(`code: ${res.body.code}`);
  });

  await it('커스텀 AppError → statusCode/code 그대로 반환', async () => {
    const res = await request(testApp).get('/app-error');
    if (res.status !== 422) throw new Error(`status ${res.status}`);
    if (res.body.code !== 'UNPROCESSABLE') throw new Error(`code: ${res.body.code}`);
  });

  await it('알 수 없는 Error → 500 반환', async () => {
    const res = await request(testApp).get('/unknown');
    if (res.status !== 500) throw new Error(`status ${res.status}`);
    if (res.body.success !== false) throw new Error('success != false');
  });

  await it('응답에 success 필드 항상 포함', async () => {
    for (const path of ['/bad-request', '/unauthorized', '/unknown']) {
      const res = await request(testApp).get(path);
      if (!('success' in res.body)) throw new Error(`${path}: success 필드 없음`);
      if (!('code' in res.body)) throw new Error(`${path}: code 필드 없음`);
      if (!('message' in res.body)) throw new Error(`${path}: message 필드 없음`);
    }
  });

  // ────────────────────────────────────────────────────────
  console.log('\n2. authenticate — JWT 미들웨어');

  const validPayload = { id: 'user-uuid-abc', email: 'test@example.com' };

  await it('유효한 Bearer 토큰 → 200, req.user 설정', async () => {
    const token = makeToken(validPayload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const res = await request(authApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    if (res.status !== 200) throw new Error(`status ${res.status}`);
    if (res.body.user.id !== validPayload.id) throw new Error(`user.id: ${res.body.user.id}`);
    if (res.body.user.email !== validPayload.email) throw new Error(`user.email: ${res.body.user.email}`);
  });

  await it('Authorization 헤더 없음 → 401', async () => {
    const res = await request(authApp).get('/protected');
    if (res.status !== 401) throw new Error(`status ${res.status}`);
  });

  await it('Bearer 없이 토큰만 전달 → 401', async () => {
    const token = makeToken(validPayload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const res = await request(authApp)
      .get('/protected')
      .set('Authorization', token);
    if (res.status !== 401) throw new Error(`status ${res.status}`);
  });

  await it('만료된 토큰 → 401', async () => {
    const token = makeToken(validPayload, process.env.JWT_ACCESS_SECRET, { expiresIn: -1 });
    const res = await request(authApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    if (res.status !== 401) throw new Error(`status ${res.status}`);
  });

  await it('잘못된 시크릿으로 서명된 토큰 → 401', async () => {
    const token = makeToken(validPayload, 'wrong-secret-xxxxx', { expiresIn: '15m' });
    const res = await request(authApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    if (res.status !== 401) throw new Error(`status ${res.status}`);
  });

  await it('조작된 토큰 문자열 → 401', async () => {
    const res = await request(authApp)
      .get('/protected')
      .set('Authorization', 'Bearer invalid.token.here');
    if (res.status !== 401) throw new Error(`status ${res.status}`);
  });

  await it('401 응답에 code:UNAUTHORIZED 포함', async () => {
    const res = await request(authApp).get('/protected');
    if (res.body.code !== 'UNAUTHORIZED') throw new Error(`code: ${res.body.code}`);
  });

  // ────────────────────────────────────────────────────────
  console.log('\n3. app.js — 미들웨어 등록 및 /health');

  const app = require('../app');

  await it('GET /health → 200 또는 503 (DB 상태)', async () => {
    const res = await request(app).get('/health');
    if (res.status !== 200 && res.status !== 503) throw new Error(`status ${res.status}`);
    if (!('success' in res.body)) throw new Error('success 필드 없음');
  });

  await it('CORS 응답 헤더 포함', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173');
    const header = res.headers['access-control-allow-origin'];
    if (!header) throw new Error('CORS 헤더 없음');
  });

  await it('존재하지 않는 경로 → 404', async () => {
    const res = await request(app).get('/nonexistent-path-xyz');
    if (res.status !== 404) throw new Error(`status ${res.status}`);
  });

  // ────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(45)}`);
  console.log(`결과: ${passed + failed}개 중 ${passed}개 통과, ${failed}개 실패`);
  if (failed > 0) process.exit(1);
  else console.log('모든 BE-03 검증 통과!\n');
}

main().catch((e) => {
  console.error('테스트 실행 오류:', e);
  process.exit(1);
});
