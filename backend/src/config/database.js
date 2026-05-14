'use strict';

const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_CONNECTION_STRING;

if (!connectionString) {
  console.error('[DB] 오류: POSTGRES_CONNECTION_STRING 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[DB] 유휴 클라이언트 오류:', err);
});

async function checkConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('[DB] PostgreSQL 연결 성공');
  } finally {
    client.release();
  }
}

async function closePool() {
  await pool.end();
  console.log('[DB] 연결 풀 종료');
}

module.exports = { pool, checkConnection, closePool };
