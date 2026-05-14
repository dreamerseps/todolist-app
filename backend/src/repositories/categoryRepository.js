'use strict';

const { pool } = require('../config/database');

function toCategory(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    isDefault: row.is_default,
  };
}

async function findAllByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM categories
     WHERE user_id IS NULL OR user_id = $1
     ORDER BY is_default DESC, name ASC`,
    [userId]
  );
  return rows.map(toCategory);
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE id = $1',
    [id]
  );
  return toCategory(rows[0] ?? null);
}

async function create(userId, name) {
  const { rows } = await pool.query(
    `INSERT INTO categories (user_id, name, is_default)
     VALUES ($1, $2, false)
     RETURNING *`,
    [userId, name]
  );
  return toCategory(rows[0]);
}

async function updateName(id, name) {
  const { rows } = await pool.query(
    'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
    [name, id]
  );
  return toCategory(rows[0] ?? null);
}

async function deleteById(id) {
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
}

async function countTodos(categoryId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM todos WHERE category_id = $1',
    [categoryId]
  );
  return rows[0].count;
}

module.exports = { findAllByUserId, findById, create, updateName, deleteById, countTodos };
