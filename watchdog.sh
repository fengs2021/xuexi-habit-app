#!/bin/bash
# xuexi-app Watchdog - 监控服务稳定性
# 确保后端和前端始终运行，崩溃后自动重启

APP_DIR="/opt/xuexi-app"
LOG_FILE="/var/log/xuexi-watchdog.log"
MAX_RESTARTS=10
RESTART_WINDOW=300  # 5分钟内最多重启次数

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 检查进程是否存活
is_running() {
    pgrep -f "node.*src/app.js" > /dev/null 2>&1
}

# 检查端口是否响应
check_backend() {
    curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health | grep -q "200"
}

check_frontend() {
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q "200"
}

# 重启后端
restart_backend() {
    log "🔄 重启后端服务..."
    pkill -f "node.*src/app.js" 2>/dev/null
    sleep 2
    cd $APP_DIR/backend
    node --env-file=$APP_DIR/.env src/app.js >> /var/log/xuexi-backend-out.log 2>&1 &
    sleep 3
    
    if check_backend; then
        log "✅ 后端重启成功"
        return 0
    else
        log "❌ 后端重启失败"
        return 1
    fi
}

# 重启前端
restart_frontend() {
    log "🔄 重启前端服务..."
    pkill -f "vite" 2>/dev/null
    sleep 2
    cd $APP_DIR/frontend
    npm run dev -- --host 0.0.0.0 >> /var/log/xuexi-frontend.log 2>&1 &
    sleep 5
    
    if check_frontend; then
        log "✅ 前端重启成功"
        return 0
    else
        log "❌ 前端重启失败"
        return 1
    fi
}

# 主监控循环
log "🚀 xuexi-app Watchdog 启动"

while true; do
    # 检查后端
    if ! check_backend; then
        log "⚠️ 后端健康检查失败"
        restart_backend
    fi
    
    # 检查前端
    if ! check_frontend; then
        log "⚠️ 前端健康检查失败"
        restart_frontend
    fi
    
    # 每30秒检查一次
    sleep 30
done
