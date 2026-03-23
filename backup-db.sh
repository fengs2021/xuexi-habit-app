#!/bin/bash
# 数据库每日备份脚本
# 保留最近3天备份

BACKUP_DIR="/opt/xuexi-app/backups"
DATE=$(date +%Y%m%d)
KEEP_DAYS=3

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
BACKUP_FILE="$BACKUP_DIR/xuexi_backup_$DATE.sql"
docker exec xuexi-postgres pg_dump -U postgres xuexi > $BACKUP_FILE 2>/dev/null

if [ -f "$BACKUP_FILE" ]; then
    echo "备份成功: $BACKUP_FILE"
    
    # 删除3天前的备份
    find $BACKUP_DIR -name "xuexi_backup_*.sql" -mtime +$KEEP_DAYS -delete
    echo "已清理超过${KEEP_DAYS}天的备份"
    
    # 显示当前备份列表
    echo "当前备份列表:"
    ls -lh $BACKUP_DIR/xuexi_backup_*.sql 2>/dev/null
else
    echo "备份失败!"
    exit 1
fi
