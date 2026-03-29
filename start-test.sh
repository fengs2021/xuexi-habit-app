#!/bin/bash
# 学习记录功能测试环境启动脚本

echo "=========================================="
echo "  学习记录功能测试环境"
echo "=========================================="
echo ""
echo "  后端: http://localhost:8081"
echo "  前端: http://localhost:3001"
echo "  数据库: xuexi_test"
echo ""
echo "=========================================="

# 启动后端
echo "[1/2] 启动后端服务..."
cd /opt/xuexi-test
PORT=8081 \
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/xuexi_test' \
JWT_SECRET='xuexi-test-secret-2024' \
ALLOWED_ORIGIN='http://localhost:3001' \
node backend/src/index.js > /tmp/xuexi-test-backend.log 2>&1 &

BACKEND_PID=$!
echo "  后端 PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 启动前端开发服务器
echo "[2/2] 启动前端服务..."
cd /opt/xuexi-test/frontend
npx vite --port 3001 > /tmp/xuexi-test-frontend.log 2>&1 &

FRONTEND_PID=$!
echo "  前端 PID: $FRONTEND_PID"

echo ""
echo "=========================================="
echo "  测试环境已启动!"
echo "  按 Ctrl+C 停止"
echo "=========================================="

# 等待退出
wait
