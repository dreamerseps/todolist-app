'use strict';

const categoriesService = require('./categories.service');
const { BadRequestError } = require('../../utils/errors');

function validateName(name, maxLen = 50) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new BadRequestError('카테고리 이름은 필수입니다');
  }
  if (name.length > maxLen) {
    throw new BadRequestError(`카테고리 이름은 ${maxLen}자 이하이어야 합니다`);
  }
}

async function getAll(req, res, next) {
  try {
    const categories = await categoriesService.getAll(req.user.id);
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name } = req.body;
    validateName(name);
    const category = await categoriesService.create(req.user.id, name);
    console.log(`[Categories] 생성 - userId: ${req.user.id}, categoryId: ${category.id}`);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { name } = req.body;
    validateName(name);
    const category = await categoriesService.update(req.params.id, req.user.id, name);
    console.log(`[Categories] 수정 - userId: ${req.user.id}, categoryId: ${req.params.id}`);
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await categoriesService.remove(req.params.id, req.user.id);
    console.log(`[Categories] 삭제 - userId: ${req.user.id}, categoryId: ${req.params.id}`);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, remove };
