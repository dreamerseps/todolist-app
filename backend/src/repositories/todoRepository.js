'use strict';

const { pool } = require('../config/database');

const SORT_MAP = {
  due_date_asc:     't.due_date ASC NULLS LAST, t.created_at DESC',
  created_at_desc:  't.created_at DESC',
};

const FIELD_MAP = {
  title:       'title',
  description: 'description',
  dueDate:     'due_date',
  categoryId:  'category_id',
  isCompleted: 'is_completed',
};

function toTodo(row) {
  if (!row) return null;
  return {
    id:           row.id,
    userId:       row.user_id,
    categoryId:   row.category_id,
    categoryName: row.category_name ?? undefined,
    title:        row.title,
    description:  row.description,
    dueDate:      row.due_date,
    isCompleted:  row.is_completed,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
  };
}

function buildFilter(userId, { categoryId, from, to, isCompleted } = {}) {
  const conds = ['t.user_id = $1'];
  const params = [userId];
  let idx = 2;

  if (categoryId != null) { conds.push(`t.category_id = $${idx++}`); params.push(categoryId); }
  if (from != null)        { conds.push(`t.due_date >= $${idx++}`);   params.push(from); }
  if (to != null)          { conds.push(`DATE(t.due_date) <= $${idx++}::date`); params.push(to); }
  if (isCompleted != null) { conds.push(`t.is_completed = $${idx++}`); params.push(isCompleted); }

  return { where: conds.join(' AND '), params, idx };
}

async function findAllByUserId(userId, opts = {}) {
  const { categoryId, from, to, isCompleted, sort, page, limit } = opts;
  const pageSize = Math.min(limit ?? 20, 100);
  const offset   = ((page ?? 1) - 1) * pageSize;
  const orderBy  = SORT_MAP[sort] ?? SORT_MAP.created_at_desc;

  const { where, params, idx } = buildFilter(userId, { categoryId, from, to, isCompleted });

  const { rows } = await pool.query(
    `SELECT t.*, c.name AS category_name
     FROM todos t
     JOIN categories c ON c.id = t.category_id
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, pageSize, offset]
  );
  return rows.map(toTodo);
}

async function countByUserId(userId, opts = {}) {
  const { categoryId, from, to, isCompleted } = opts;
  const { where, params } = buildFilter(userId, { categoryId, from, to, isCompleted });

  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM todos t WHERE ${where}`,
    params
  );
  return rows[0].count;
}

async function findByIdOnly(id) {
  const { rows } = await pool.query(
    `SELECT t.*, c.name AS category_name
     FROM todos t
     JOIN categories c ON c.id = t.category_id
     WHERE t.id = $1`,
    [id]
  );
  return toTodo(rows[0] ?? null);
}

async function findById(id, userId) {
  const { rows } = await pool.query(
    `SELECT t.*, c.name AS category_name
     FROM todos t
     JOIN categories c ON c.id = t.category_id
     WHERE t.id = $1 AND t.user_id = $2`,
    [id, userId]
  );
  return toTodo(rows[0] ?? null);
}

async function create(userId, { title, description, dueDate, categoryId }) {
  const { rows } = await pool.query(
    `INSERT INTO todos (user_id, category_id, title, description, due_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, categoryId, title, description ?? null, dueDate ?? null]
  );
  return toTodo(rows[0]);
}

async function update(id, userId, fields) {
  const sets = [];
  const params = [];
  let idx = 1;

  for (const [key, col] of Object.entries(FIELD_MAP)) {
    if (key in fields) {
      sets.push(`${col} = $${idx++}`);
      params.push(fields[key]);
    }
  }

  if (sets.length === 0) return findById(id, userId);

  params.push(id, userId);
  const { rows } = await pool.query(
    `UPDATE todos SET ${sets.join(', ')}
     WHERE id = $${idx++} AND user_id = $${idx++}
     RETURNING *`,
    params
  );
  return toTodo(rows[0] ?? null);
}

async function deleteById(id, userId) {
  const { rowCount } = await pool.query(
    'DELETE FROM todos WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
}

async function deleteManyByIds(ids, userId) {
  if (ids.length === 0) return 0;
  const { rowCount } = await pool.query(
    'DELETE FROM todos WHERE id = ANY($1::uuid[]) AND user_id = $2',
    [ids, userId]
  );
  return rowCount;
}

module.exports = { findAllByUserId, countByUserId, findByIdOnly, findById, create, update, deleteById, deleteManyByIds };
