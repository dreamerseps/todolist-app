-- 기본 카테고리 시드 데이터
-- 멱등성 보장: 이미 존재하는 기본 카테고리는 삽입하지 않음
INSERT INTO categories (name, is_default, user_id)
SELECT v.name, true, NULL
FROM (VALUES ('업무'), ('개인'), ('기타')) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE is_default = true AND name = v.name
);
