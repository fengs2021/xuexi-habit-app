-- 修复负分问题：给 stars 列加 CHECK 约束防止负数
-- 执行方式: psql $DATABASE_URL -f add_stars_check_constraint.sql

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_stars_non_negative;
ALTER TABLE users ADD CONSTRAINT users_stars_non_negative CHECK (stars >= 0);

-- 同时给 total_stars 加约束（累计获得不应该是负数）
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_total_stars_non_negative;
ALTER TABLE users ADD CONSTRAINT users_total_stars_non_negative CHECK (total_stars >= 0);

-- 给 user_daily_spins 加唯一约束，防止并发导致的多条记录
ALTER TABLE user_daily_spins DROP CONSTRAINT IF EXISTS unique_user_spin_date;
ALTER TABLE user_daily_spins ADD CONSTRAINT unique_user_spin_date UNIQUE (user_id, spin_date);
