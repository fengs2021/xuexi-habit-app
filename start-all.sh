#!/bin/bash
# xuexi-app 启动脚本

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 启动数据库
docker start xuexi-postgres 2>/dev/null || docker run -d --name xuexi-postgres -e POSTGRES_PASSWORD=xuexi123456 -e POSTGRES_DB=xuexi -p 5432:5432 postgres:15-alpine

# 等待数据库就绪
sleep 2

# 启动后端（使用 --env-file 加载 .env）
cd /opt/xuexi-app/backend
pkill -f "node src/app.js" 2>/dev/null
nohup node --env-file=$SCRIPT_DIR/.env src/app.js > /tmp/xuexi-backend.log 2>&1 &

# 启动前端
cd /opt/xuexi-app/frontend
pkill -f vite 2>/dev/null
nohup npm run dev -- --host 0.0.0.0 > /tmp/xuexi-frontend.log 2>&1 &

echo "xuexi-app started"
