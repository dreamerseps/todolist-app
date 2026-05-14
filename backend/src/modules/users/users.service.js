'use strict';

const userRepository = require('../../repositories/userRepository');
const { comparePassword, hashPassword } = require('../../utils/bcrypt');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../../utils/errors');

async function getMe(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError('사용자를 찾을 수 없습니다');
  return user;
}

async function updateMe(userId, body) {
  if ('email' in body) {
    throw new BadRequestError('이메일은 변경할 수 없습니다');
  }

  const { name, currentPassword, newPassword } = body;
  const hasName     = name !== undefined;
  const hasPassword = currentPassword !== undefined || newPassword !== undefined;

  if (!hasName && !hasPassword) {
    throw new BadRequestError('변경할 항목(name 또는 currentPassword/newPassword)을 입력해주세요');
  }

  if (hasName) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new BadRequestError('이름은 1자 이상이어야 합니다');
    }
    if (name.length > 100) {
      throw new BadRequestError('이름은 100자 이하이어야 합니다');
    }
    const updated = await userRepository.updateName(userId, name);
    return updated;
  }

  // 비밀번호 변경
  if (!currentPassword || !newPassword) {
    throw new BadRequestError('currentPassword와 newPassword를 모두 입력해주세요');
  }
  if (newPassword.length < 8) {
    throw new BadRequestError('새 비밀번호는 8자 이상이어야 합니다');
  }

  const row = await userRepository.findByEmail(
    (await userRepository.findById(userId)).email
  );
  const isMatch = await comparePassword(currentPassword, row.password_hash);
  if (!isMatch) {
    throw new UnauthorizedError('현재 비밀번호가 올바르지 않습니다');
  }

  const newHash = await hashPassword(newPassword);
  const updated = await userRepository.updatePasswordHash(userId, newHash);
  return updated;
}

module.exports = { getMe, updateMe };
