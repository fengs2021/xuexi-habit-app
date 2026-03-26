#!/bin/bash
# 自动修复用户积分数据与 point_logs 一致性
# 发现不一致时自动执行

DB_NAME="xuexi"
DB_USER="postgres"

echo "========== $(date) 积分一致性修复 ==========" >> /opt/xuexi-app/logs/points_consistency.log

# 自动修复不一致的用户
docker exec xuexi-postgres psql -U $DB_USER -d $DB_NAME -c "
-- 为每个不一致的用户计算正确的值并更新
WITH correct_values AS (
  SELECT 
    u.id as user_id,
    COALESCE(SUM(pl.amount), 0)::int as correct_stars,
    COALESCE(SUM(CASE WHEN pl.amount > 0 THEN pl.amount ELSE 0 END), 0)::int as correct_total
  FROM users u
  LEFT JOIN point_logs pl ON u.id = pl.user_id
  WHERE u.role = 'child'
  GROUP BY u.id
)
UPDATE users u SET 
  stars = cv.correct_stars,
  total_stars = cv.correct_total
FROM correct_values cv
WHERE u.id = cv.user_id
  AND (u.stars != cv.correct_stars OR u.total_stars != cv.correct_total);
" >> /opt/xuexi-app/logs/points_consistency.log 2>&1

echo "修复完成: $(date)" >> /opt/xuexi-app/logs/points_consistency.log
echo "" >> /opt/xuexi-app/logs/points_consistency.log
