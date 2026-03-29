# 学习记录功能测试环境

> 用于在不影响生产环境的情况下测试学习记录功能

## 环境配置

| 项目 | 生产环境 | 测试环境 |
|------|---------|---------|
| 前端 | localhost:3000 | localhost:3001 |
| 后端 | localhost:8080 | localhost:8081 |
| 数据库 | xuexi | xuexi_test |
| 代码目录 | /opt/xuexi | /opt/xuexi-test |

## 快速启动

```bash
# 启动测试环境
/opt/xuexi-test/start-test.sh

# 或者手动启动
cd /opt/xuexi-test
PORT=8081 DATABASE_URL='postgresql://postgres:postgres@localhost:5432/xuexi_test' \
JWT_SECRET='xuexi-test-secret-2024' \
ALLOWED_ORIGIN='http://localhost:3001' \
node backend/src/index.js

# 前端(新窗口)
cd /opt/xuexi-test/frontend
npx vite --port 3001
```

## 访问地址

- 测试前端: http://localhost:3001
- 测试后端API: http://localhost:8081/api

## 测试账号

同生产环境：
- 家长账号：`15956239925` / `19900915`
- 孩子账号：瑶瑶

## 停止测试环境

```bash
# 停止后端
pkill -f "xuexi-test-backend" 2>/dev/null

# 停止前端
pkill -f "vite.*3001" 2>/dev/null

# 或者 kill 对应的 PID
```

## 数据库

测试数据库已创建: `xuexi_test`

查看数据库:
```bash
docker exec -it xuexi-postgres psql -U postgres -d xuexi_test
```

清空测试数据:
```bash
docker exec xuexi-postgres psql -U postgres -d xuexi_test -c "TRUNCATE TABLE study_records, study_questions, study_wrong_questions, study_practice_logs, study_review_logs, study_subjects CASCADE;"
```

## Git 分支

- 功能分支: `feature/study-records`
- 生产分支: `main`

## 开发流程

1. 在 `feature/study-records` 分支开发
2. 测试完成后合并到 `main`
3. 生产环境从 `main` 拉取更新
