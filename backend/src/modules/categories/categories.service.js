'use strict';

const categoryRepository = require('../../repositories/categoryRepository');
const {
  BadRequestError, ForbiddenError, NotFoundError, UnprocessableEntityError,
} = require('../../utils/errors');

async function getAll(userId) {
  return categoryRepository.findAllByUserId(userId);
}

async function create(userId, name) {
  return categoryRepository.create(userId, name);
}

async function update(id, userId, name) {
  const category = await categoryRepository.findById(id);
  if (!category) throw new NotFoundError('카테고리를 찾을 수 없습니다');
  if (category.isDefault) throw new BadRequestError('기본 카테고리는 수정할 수 없습니다');
  if (category.userId !== userId) throw new ForbiddenError('다른 사용자의 카테고리는 수정할 수 없습니다');

  const updated = await categoryRepository.updateName(id, name);
  return updated;
}

async function remove(id, userId) {
  const category = await categoryRepository.findById(id);
  if (!category) throw new NotFoundError('카테고리를 찾을 수 없습니다');
  if (category.isDefault) throw new BadRequestError('기본 카테고리는 삭제할 수 없습니다');
  if (category.userId !== userId) throw new ForbiddenError('다른 사용자의 카테고리는 삭제할 수 없습니다');

  const count = await categoryRepository.countTodos(id);
  if (count > 0) {
    throw new UnprocessableEntityError('할일이 속한 카테고리는 삭제할 수 없습니다');
  }

  await categoryRepository.deleteById(id);
}

module.exports = { getAll, create, update, remove };
