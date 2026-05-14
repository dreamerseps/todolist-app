'use strict';

const jwt = require('jsonwebtoken');

function signAccessToken(payload) {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET 환경변수가 설정되지 않았습니다');
  return jwt.sign(payload, secret, { expiresIn: '15m' });
}

function signRefreshToken(payload) {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET 환경변수가 설정되지 않았습니다');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

module.exports = { signAccessToken, signRefreshToken, verifyToken };
