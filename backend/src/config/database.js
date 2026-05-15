'use strict';

const { Pool, types } = require('pg');

// TIMESTAMP WITHOUT TIME ZONE(1114)을 Date 객체로 변환하지 않고 문자열 그대로 반환
// pg 기본 동작은 서버 로컬 타임존을 적용해 UTC로 변환하므로 시간이 달라지는 문제가 있음
types.setTypeParser(1114, (val) => val);

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
