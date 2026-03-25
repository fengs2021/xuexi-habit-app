-- ============================================
-- 学习app初始数据导入脚本
-- 运行方式: psql -U postgres -d xuexi -f init-data.sql
-- ============================================

-- 导入贴纸数据
\i init-stickers.sql

-- 导入成就数据
\i init-achievements.sql

-- 验证数据
SELECT '贴纸总数:' as info, COUNT(*) as count FROM stickers
UNION ALL
SELECT '成就总数:', COUNT(*) FROM achievement_definitions;
