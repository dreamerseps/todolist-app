'use strict';

const fs   = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function dirExists(rel) {
  return fs.existsSync(path.resolve(__dirname, '../../..', rel));
}
function fileExists(rel) {
  const p = path.resolve(__dirname, '../../..', rel);
  return fs.existsSync(p) && fs.statSync(p).isFile();
}

console.log('\n[BE-01] 프로젝트 구조 검증\n');

console.log('1. 패키지 의존성 확인');
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'));
const deps    = pkg.dependencies    || {};
const devDeps = pkg.devDependencies || {};
['express', 'pg', 'bcryptjs', 'jsonwebtoken', 'cors', 'dotenv'].forEach(name =>
  assert(`dependencies.${name} 설치됨`, name in deps)
);
assert('devDependencies.nodemon 설치됨', 'nodemon' in devDeps);

console.log('\n2. node_modules 설치 확인');
['express', 'pg', 'bcryptjs', 'jsonwebtoken', 'cors', 'dotenv', 'nodemon'].forEach(name =>
  assert(`node_modules/${name} 존재`, dirExists(`backend/node_modules/${name}`))
);

console.log('\n3. 디렉토리 구조 확인');
[
  'backend/src/config',
  'backend/src/middlewares',
  'backend/src/modules/auth',
  'backend/src/modules/users',
  'backend/src/modules/categories',
  'backend/src/modules/todos',
  'backend/src/repositories',
  'backend/src/utils',
].forEach(d => assert(d, dirExists(d)));

console.log('\n4. 핵심 파일 확인');
[
  'backend/src/app.js',
  'backend/src/server.js',
  'backend/src/config/database.js',
  'backend/src/repositories/userRepository.js',
  'backend/src/repositories/categoryRepository.js',
  'backend/src/repositories/todoRepository.js',
  'backend/.gitignore',
].forEach(f => assert(f, fileExists(f)));

console.log('\n5. package.json scripts 확인');
const scripts = pkg.scripts || {};
assert('scripts.start 존재', 'start' in scripts);
assert('scripts.dev 존재', 'dev' in scripts);
assert('scripts.start = "node src/server.js"', scripts.start === 'node src/server.js', scripts.start);
assert('scripts.dev 에 nodemon 사용', (scripts.dev || '').includes('nodemon'), scripts.dev);

console.log('\n6. .gitignore 내용 확인');
const gitignore = fs.readFileSync(path.resolve(__dirname, '../../.gitignore'), 'utf8');
assert('.gitignore에 node_modules/ 포함', gitignore.includes('node_modules/'));
assert('.gitignore에 .env 포함', gitignore.includes('.env'));

console.log('\n7. app.js 모듈 로드 확인');
try {
  const app = require('../app');
  assert('app.js require 성공', typeof app === 'function' || typeof app === 'object');
  const src = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
  assert('GET /health 라우트 등록됨', src.includes("'/health'") || src.includes('"/health"'));
} catch (e) {
  assert('app.js require 성공', false, e.message);
  assert('GET /health 라우트 등록됨', false);
}

console.log(`\n${'─'.repeat(40)}`);
console.log(`결과: ${passed + failed}개 중 ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('모든 BE-01 검증 통과!\n');
}
