'use strict';

const todosService = require('./todos.service');
const { BadRequestError } = require('../../utils/errors');

function parseBoolean(val) {
  if (val === 'true')  return true;
  if (val === 'false') return false;
  return undefined;
}

function parsePositiveInt(val, fallback) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function getAll(req, res, next) {
  try {
    const {
      category_id,
      from,
      to,
      is_completed,
      sort,
      page,
      limit,
    } = req.query;

    if (from && to && from > to) {
      throw new BadRequestError('from 날짜는 to 날짜보다 클 수 없습니다');
    }

    const opts = {
      categoryId:  category_id  || undefined,
      from:        from         || undefined,
      to:          to           || undefined,
      isCompleted: parseBoolean(is_completed),
      sort:        sort         || undefined,
      page:        parsePositiveInt(page,  1),
      limit:       parsePositiveInt(limit, 20),
    };

    const result = await todosService.getAll(req.user.id, opts);
    console.log(`[Todos] 목록 조회 - userId: ${req.user.id}, count: ${result.total ?? result.length}`);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const todo = await todosService.getById(req.params.id, req.user.id);
    res.json({ success: true, data: todo });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, description, dueDate, categoryId } = req.body;
    if (!title || (typeof title === 'string' && title.trim().length === 0)) {
      throw new BadRequestError('title은 필수입니다');
    }
    const todo = await todosService.create(req.user.id, { title, description, dueDate, categoryId });
    console.log(`[Todos] 생성 - userId: ${req.user.id}, todoId: ${todo.id}`);
    res.status(201).json({ success: true, data: todo });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const todo = await todosService.update(req.params.id, req.user.id, req.body);
    console.log(`[Todos] 수정 - userId: ${req.user.id}, todoId: ${req.params.id}`);
    res.json({ success: true, data: todo });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await todosService.remove(req.params.id, req.user.id);
    console.log(`[Todos] 삭제 - userId: ${req.user.id}, todoId: ${req.params.id}`);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
