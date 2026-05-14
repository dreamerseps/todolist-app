'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_CONNECTION_STRING;
if (!connectionString) {
  console.error('[Seed] 오류: POSTGRES_CONNECTION_STRING 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function seed() {
  const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    const { rows } = await client.query(
      "SELECT id, name FROM categories WHERE is_default = true ORDER BY name"
    );
    console.log(`[Seed] 기본 카테고리 ${rows.length}건 확인:`);
    rows.forEach((r) => console.log(`  - ${r.name} (${r.id})`));
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('[Seed] 오류:', err.message);
  process.exit(1);
});
