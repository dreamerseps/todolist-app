'use strict';

const { verifyToken }      = require('../utils/jwt');
const { UnauthorizedError } = require('../utils/errors');

function authenticate(req, _res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('인증 토큰이 필요합니다'));
  }

  const token = authHeader.slice(7);

  try {
    const secret  = process.env.JWT_ACCESS_SECRET;
    const decoded = verifyToken(token, secret);
    req.user = { id: decoded.id, email: decoded.email };
    console.log(`[Auth] 인증 성공 - userId: ${decoded.id}`);
    next();
  } catch {
    console.warn(`[Auth] 인증 실패 - 유효하지 않은 토큰`);
    next(new UnauthorizedError('유효하지 않거나 만료된 토큰입니다'));
  }
}

module.exports = authenticate;
