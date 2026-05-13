-- =============================================================
-- TodoListApp Database Schema
-- 참조 문서: docs/6-erd.md (v1.0), docs/2-prd.md (v1.2)
-- 작성일: 2026-05-13
-- DB: PostgreSQL 17
-- =============================================================

-- UUID 생성 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- 기존 테이블 제거 (개발 환경 재초기화용)
-- =============================================================
DROP TABLE IF EXISTS todos      CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users      CASCADE;

-- =============================================================
-- 1. users
-- =============================================================
CREATE TABLE users (
    id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    name          VARCHAR(100)  NOT NULL,
    provider      VARCHAR(20)   NOT NULL DEFAULT 'local',   -- local | google | facebook (2차 확장)
    provider_id   VARCHAR(255)  NULL,                       -- OAuth 제공자 사용자 ID (local 시 NULL)
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- BR-07: 이메일 중복 불가 (UNIQUE 제약으로 보장)
-- BR-09: 이메일 변경 불가 (애플리케이션 계층에서 수정 쿼리 차단)

-- =============================================================
-- 2. categories
-- =============================================================
CREATE TABLE categories (
    id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID         NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    is_default BOOLEAN      NOT NULL DEFAULT false
);

-- BR-03: 기본 카테고리 → is_default=true, user_id=NULL
-- BR-04: 사용자 정의 카테고리 → is_default=false, user_id NOT NULL
-- BR-08: 할일이 있는 카테고리 삭제 불가 → 애플리케이션 계층에서 검증

-- =============================================================
-- 3. todos
-- =============================================================
CREATE TABLE todos (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id  UUID         NOT NULL REFERENCES categories(id),   -- BR-05: 카테고리 필수
    title        VARCHAR(255) NOT NULL,
    description  TEXT         NULL,
    due_date     DATE         NULL,
    is_completed BOOLEAN      NOT NULL DEFAULT false,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- BR-05: category_id NOT NULL → 할일 등록 시 카테고리 필수
-- BR-06: category_id, due_date, is_completed 컬럼으로 필터링
-- ON DELETE CASCADE: 사용자 삭제 시 해당 사용자의 할일 전체 삭제

-- =============================================================
-- 인덱스
-- =============================================================

-- users: 로그인 시 이메일 조회 최적화
CREATE INDEX idx_users_email         ON users(email);

-- categories: 사용자별 카테고리 목록 조회
CREATE INDEX idx_categories_user_id  ON categories(user_id);

-- todos: 사용자별 할일 조회 (기본 조회)
CREATE INDEX idx_todos_user_id       ON todos(user_id);

-- todos: 카테고리 삭제 시 할일 존재 여부 확인 (BR-08)
CREATE INDEX idx_todos_category_id   ON todos(category_id);

-- todos: 사용자 + 카테고리 복합 필터링 최적화 (BR-06)
CREATE INDEX idx_todos_user_category ON todos(user_id, category_id);

-- todos: 마감일 정렬 및 기간 필터링 최적화 (BR-06)
CREATE INDEX idx_todos_due_date      ON todos(user_id, due_date);

-- =============================================================
-- updated_at 자동 갱신 트리거
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
