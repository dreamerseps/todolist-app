'use strict';

process.env.JWT_ACCESS_SECRET  = 'test-access-secret-32chars-xxxxxxxxxxx';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32chars-xxxxxxxxxx';

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function assertAsync(label, fn) {
  try {
    const result = await fn();
    if (result === true || result === undefined) {
      console.log(`  ✓ ${label}`);
      passed++;
    } else {
      console.error(`  ✗ ${label} — returned ${result}`);
      failed++;
    }
  } catch (e) {
    console.error(`  ✗ ${label} — threw: ${e.message}`);
    failed++;
  }
}

async function assertThrows(label, fn, check) {
  try {
    await fn();
    console.error(`  ✗ ${label} — 예외가 발생하지 않음`);
    failed++;
  } catch (e) {
    if (!check || check(e)) {
      console.log(`  ✓ ${label}`);
      passed++;
    } else {
      console.error(`  ✗ ${label} — 예외 조건 불일치: ${e.message}`);
      failed++;
    }
  }
}

async function main() {
  console.log('\n[BE-02] 공통 유틸리티 검증\n');

  // ─── 1. errors.js ────────────────────────────────────────
  console.log('1. errors.js — 커스텀 에러 클래스');

  const {
    AppError, BadRequestError, UnauthorizedError,
    ForbiddenError, NotFoundError, ConflictError,
  } = require('../utils/errors');

  const base = new AppError('기본 에러', 500, 'INTERNAL_ERROR');
  assert('AppError instanceof Error',  base instanceof Error);
  assert('AppError.message',           base.message === '기본 에러');
  assert('AppError.statusCode',        base.statusCode === 500);
  assert('AppError.code',              base.code === 'INTERNAL_ERROR');

  const br = new BadRequestError('잘못된 요청');
  assert('BadRequestError.statusCode=400',    br.statusCode === 400);
  assert('BadRequestError instanceof AppError', br instanceof AppError);

  const ua = new UnauthorizedError('인증 필요');
  assert('UnauthorizedError.statusCode=401',  ua.statusCode === 401);

  const fb = new ForbiddenError('권한 없음');
  assert('ForbiddenError.statusCode=403',     fb.statusCode === 403);

  const nf = new NotFoundError('없음');
  assert('NotFoundError.statusCode=404',      nf.statusCode === 404);

  const cf = new ConflictError('충돌');
  assert('ConflictError.statusCode=409',      cf.statusCode === 409);

  assert('각 서브클래스가 AppError 상속', [br, ua, fb, nf, cf].every(e => e instanceof AppError));
  assert('각 서브클래스가 Error 상속',    [br, ua, fb, nf, cf].every(e => e instanceof Error));

  // ─── 2. validate.js ──────────────────────────────────────
  console.log('\n2. validate.js — 유효성 검사');

  const { isValidEmail, isValidPassword, isRequired } = require('../utils/validate');

  assert('isValidEmail("user@example.com") = true', isValidEmail('user@example.com') === true);
  assert('isValidEmail("a@b.co") = true',            isValidEmail('a@b.co') === true);
  assert('isValidEmail("notanemail") = false',        isValidEmail('notanemail') === false);
  assert('isValidEmail("@no-local.com") = false',    isValidEmail('@no-local.com') === false);
  assert('isValidEmail("") = false',                  isValidEmail('') === false);
  assert('isValidEmail(null) = false',                isValidEmail(null) === false);

  assert('isValidPassword("12345678") = true',  isValidPassword('12345678') === true);
  assert('isValidPassword("abcdefgh") = true',  isValidPassword('abcdefgh') === true);
  assert('isValidPassword("1234567") = false',  isValidPassword('1234567') === false);
  assert('isValidPassword("") = false',          isValidPassword('') === false);
  assert('isValidPassword(null) = false',        isValidPassword(null) === false);

  assert('isRequired("hello") = true',    isRequired('hello') === true);
  assert('isRequired("  ") = false',      isRequired('  ') === false);
  assert('isRequired("") = false',        isRequired('') === false);
  assert('isRequired(null) = false',      isRequired(null) === false);
  assert('isRequired(undefined) = false', isRequired(undefined) === false);
  assert('isRequired(0) = true',          isRequired(0) === true);

  // ─── 3. bcrypt.js ────────────────────────────────────────
  console.log('\n3. bcrypt.js — 비밀번호 해싱');

  const { hashPassword, comparePassword } = require('../utils/bcrypt');

  let hash;
  await assertAsync('hashPassword("password123") 정상 실행', async () => {
    hash = await hashPassword('password123');
    return typeof hash === 'string' && hash.startsWith('$2');
  });

  await assertAsync('bcrypt 해시 길이 60자 이상', async () => hash.length >= 60);

  await assertAsync('comparePassword 일치 시 true', async () => {
    const result = await comparePassword('password123', hash);
    return result === true;
  });

  await assertAsync('comparePassword 불일치 시 false', async () => {
    const result = await comparePassword('wrongpass', hash);
    return result === false;
  });

  await assertAsync('hashPassword 호출마다 다른 해시 생성 (salt)', async () => {
    const h2 = await hashPassword('password123');
    return hash !== h2;
  });

  // ─── 4. jwt.js ───────────────────────────────────────────
  console.log('\n4. jwt.js — JWT 토큰 발급/검증');

  const { signAccessToken, signRefreshToken, verifyToken } = require('../utils/jwt');

  const payload = { id: 'user-uuid-123', email: 'test@example.com' };
  let accessToken, refreshToken;

  await assertAsync('signAccessToken 반환값이 문자열', async () => {
    accessToken = signAccessToken(payload);
    return typeof accessToken === 'string' && accessToken.split('.').length === 3;
  });

  await assertAsync('signRefreshToken 반환값이 문자열', async () => {
    refreshToken = signRefreshToken(payload);
    return typeof refreshToken === 'string' && refreshToken.split('.').length === 3;
  });

  await assertAsync('verifyToken(accessToken) — payload.id 복원', async () => {
    const decoded = verifyToken(accessToken, process.env.JWT_ACCESS_SECRET);
    return decoded.id === payload.id && decoded.email === payload.email;
  });

  await assertAsync('verifyToken(refreshToken) — payload.id 복원', async () => {
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    return decoded.id === payload.id;
  });

  await assertThrows(
    'verifyToken — 잘못된 시크릿 시 예외 발생',
    async () => verifyToken(accessToken, 'wrong-secret'),
    (e) => e.name === 'JsonWebTokenError',
  );

  await assertThrows(
    'verifyToken — 만료된 토큰 시 예외 발생',
    async () => {
      const jwt = require('jsonwebtoken');
      const expired = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: -1 });
      verifyToken(expired, process.env.JWT_ACCESS_SECRET);
    },
    (e) => e.name === 'TokenExpiredError',
  );

  await assertThrows(
    'verifyToken — 조작된 토큰 시 예외 발생',
    async () => verifyToken('invalid.token.here', process.env.JWT_ACCESS_SECRET),
  );

  await assertAsync('Access Token과 Refresh Token이 다름', async () => {
    return accessToken !== refreshToken;
  });

  // ─── 결과 ────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(45)}`);
  console.log(`결과: ${passed + failed}개 중 ${passed}개 통과, ${failed}개 실패`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('모든 BE-02 검증 통과!\n');
  }
}

main().catch((e) => {
  console.error('테스트 실행 오류:', e);
  process.exit(1);
});
