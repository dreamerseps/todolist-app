'use strict';

const todoRepository     = require('../../repositories/todoRepository');
const categoryRepository = require('../../repositories/categoryRepository');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../../utils/errors');

async function assertCategoryAccessible(categoryId, userId) {
  if (!categoryId) throw new BadRequestError('categoryId는 필수입니다 (BR-05)');
  const category = await categoryRepository.findById(categoryId);
  if (!category) throw new BadRequestError('존재하지 않는 카테고리입니다');
  if (!category.isDefault && category.userId !== userId) {
    throw new BadRequestError('접근할 수 없는 카테고리입니다 (BR-05)');
  }
}

async function getAll(userId, opts = {}) {
  const [todos, total] = await Promise.all([
    todoRepository.findAllByUserId(userId, opts),
    todoRepository.countByUserId(userId, opts),
  ]);

  const pageSize   = Math.min(opts.limit ?? 20, 100);
  const page       = opts.page ?? 1;
  const totalPages = Math.ceil(total / pageSize);

  return { todos, total, page, pageSize, totalPages };
}

async function getById(id, userId) {
  const todo = await todoRepository.findById(id, userId);
  if (!todo) throw new NotFoundError('할일을 찾을 수 없습니다');
  return todo;
}

async function create(userId, { title, description, dueDate, categoryId }) {
  await assertCategoryAccessible(categoryId, userId);
  const todo = await todoRepository.create(userId, { title, description, dueDate, categoryId });
  return todo;
}

async function update(id, userId, fields) {
  // 소유권 확인: 존재하지 않으면 404, 다른 사용자 것이면 403
  const existing = await todoRepository.findByIdOnly(id);
  if (!existing) throw new NotFoundError('할일을 찾을 수 없습니다');
  if (existing.userId !== userId) throw new ForbiddenError('다른 사용자의 할일은 수정할 수 없습니다');

  // categoryId 변경 시 접근 가능 여부 검증
  if ('categoryId' in fields && fields.categoryId != null) {
    await assertCategoryAccessible(fields.categoryId, userId);
  }

  const updated = await todoRepository.update(id, userId, fields);
  if (!updated) throw new NotFoundError('할일을 찾을 수 없습니다');
  return updated;
}

async function remove(id, userId) {
  const deleted = await todoRepository.deleteById(id, userId);
  if (!deleted) throw new NotFoundError('할일을 찾을 수 없습니다');
}

module.exports = { getAll, getById, create, update, remove };
