'use strict';

const { pool } = require('../config/database');

function toUser(row) {
  if (!row) return null;
  const { password_hash, provider_id, ...rest } = row;
  return {
    id: rest.id,
    email: rest.email,
    name: rest.name,
    provider: rest.provider,
    createdAt: rest.created_at,
    updatedAt: rest.updated_at,
  };
}

async function findByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0] ?? null;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return toUser(rows[0] ?? null);
}

async function create({ email, passwordHash, name }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, passwordHash, name]
  );
  return toUser(rows[0]);
}

async function updateName(id, name) {
  const { rows } = await pool.query(
    `UPDATE users SET name = $1 WHERE id = $2 RETURNING *`,
    [name, id]
  );
  return toUser(rows[0] ?? null);
}

async function updatePasswordHash(id, passwordHash) {
  const { rows } = await pool.query(
    `UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *`,
    [passwordHash, id]
  );
  return toUser(rows[0] ?? null);
}

module.exports = { findByEmail, findById, create, updateName, updatePasswordHash };
