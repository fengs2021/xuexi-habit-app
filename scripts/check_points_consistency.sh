#!/bin/bash
# 核查用户积分数据与 point_logs 一致性
# 每天凌晨 4 点自动执行

DB_NAME="xuexi"
DB_USER="postgres"

LOG_FILE="/opt/xuexi-app/logs/points_consistency.log"
mkdir -p /opt/xuexi-app/logs

echo "========== $(date) 积分一致性核查 ==========" >> $LOG_FILE

# 检查不一致的用户
docker exec xuexi-postgres psql -U $DB_USER -d $DB_NAME -t -c "
SELECT 
  u.id,
  u.nickname,
  u.stars as user_stars,
  u.total_stars as user_total,
  COALESCE(SUM(pl.amount), 0)::int as logs_balance,
  COALESCE(SUM(CASE WHEN pl.amount > 0 THEN pl.amount ELSE 0 END), 0)::int as logs_earned
FROM users u
LEFT JOIN point_logs pl ON u.id = pl.user_id
WHERE u.role = 'child'
GROUP BY u.id, u.nickname, u.stars, u.total_stars
HAVING u.stars != COALESCE(SUM(pl.amount), 0) 
   OR u.total_stars != COALESCE(SUM(CASE WHEN pl.amount > 0 THEN pl.amount ELSE 0 END), 0)
ORDER BY u.nickname;
" >> $LOG_FILE 2>&1

# 如果没有不一致的输出，说明全部一致
if ! grep -q "b9110\|[a-z0-9-]*{" $LOG_FILE 2>/dev/null; then
  echo "✅ 全部用户积分数据一致" >> $LOG_FILE
fi

echo "核查完成" >> $LOG_FILE
echo "" >> $LOG_FILE
