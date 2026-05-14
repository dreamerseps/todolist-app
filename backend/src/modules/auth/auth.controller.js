'use strict';

const authService = require('./auth.service');
const { isValidEmail, isValidPassword, isRequired } = require('../../utils/validate');
const { BadRequestError } = require('../../utils/errors');

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    if (!isRequired(email) || !isRequired(password) || !isRequired(name)) {
      throw new BadRequestError('email, password, name은 필수 항목입니다');
    }
    if (!isValidEmail(email)) {
      throw new BadRequestError('유효하지 않은 이메일 형식입니다');
    }
    if (!isValidPassword(password)) {
      throw new BadRequestError('비밀번호는 8자 이상이어야 합니다');
    }

    const user = await authService.register({ email, password, name });
    console.log(`[Auth] 회원가입 성공 - email: ${email}`);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!isRequired(email) || !isRequired(password)) {
      throw new BadRequestError('email과 password는 필수 항목입니다');
    }

    const result = await authService.login({ email, password });
    console.log(`[Auth] 로그인 성공 - email: ${email}`);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!isRequired(refreshToken)) {
      throw new BadRequestError('refreshToken은 필수 항목입니다');
    }
    const result = authService.refresh(refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  console.log(`[Auth] 로그아웃 - userId: ${req.user?.id}`);
  res.json({ success: true, data: { message: '로그아웃되었습니다' } });
}

module.exports = { register, login, refresh, logout };
