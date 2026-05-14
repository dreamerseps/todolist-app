'use strict';

const userRepository          = require('../../repositories/userRepository');
const { hashPassword, comparePassword } = require('../../utils/bcrypt');
const { signAccessToken, signRefreshToken, verifyToken } = require('../../utils/jwt');
const { ConflictError, UnauthorizedError } = require('../../utils/errors');

async function register({ email, password, name }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new ConflictError('이미 사용 중인 이메일입니다');
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepository.create({ email, passwordHash, name });
  return user;
}

async function login({ email, password }) {
  const row = await userRepository.findByEmail(email);
  if (!row) {
    throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다');
  }

  const isMatch = await comparePassword(password, row.password_hash);
  if (!isMatch) {
    throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다');
  }

  const payload      = { id: row.id, email: row.email };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id:    row.id,
      email: row.email,
      name:  row.name,
    },
  };
}

function refresh(rawRefreshToken) {
  try {
    const secret  = process.env.JWT_REFRESH_SECRET;
    const decoded = verifyToken(rawRefreshToken, secret);
    const payload = { id: decoded.id, email: decoded.email };
    return { accessToken: signAccessToken(payload) };
  } catch {
    throw new UnauthorizedError('유효하지 않거나 만료된 Refresh Token입니다');
  }
}

module.exports = { register, login, refresh };
