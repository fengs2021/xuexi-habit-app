# 🏠 习惯养成 (xuexi-habit-app)

> 儿童任务奖励系统 - 让孩子在游戏中养成好习惯

![](https://img.shields.io/badge/Node-22-green)
![](https://img.shields.io/badge/Vue-3-blue)
![](https://img.shields.io/badge/Koa-2-brightgreen)
![](https://img.shields.io/badge/PostgreSQL-15-blue)

## 📖 简介

习惯养成是一款专为 3-12 岁儿童设计的亲子互动任务奖励应用。孩子完成任务获得星星，积累星星兑换愿望奖励，帮助孩子在游戏化过程中养成良好习惯。

### 核心功能

- ⭐ **星星系统** - 完成任务获得星星，兑换愿望
- 🎯 **目标管理** - 设定习惯养成目标
- 📋 **任务卡片** - 支持滑动操作的卡片式任务
- 🎁 **奖励兑换** - 丰富的奖励商品库
- 🏆 **成就系统** - 记录孩子的成长历程
- 👨‍👩‍👧‍👦 **家庭管理** - 支持多个孩子、家长管理

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Vue3 + Vite + Vant4 | 响应式移动端 UI |
| 后端 | Node.js + Koa2 | 轻量级 REST API |
| 数据库 | PostgreSQL 15 | 关系型数据存储 |
| 认证 | JWT | 无状态安全认证 |
| 部署 | Docker Compose | 容器化部署 |

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 13
- Docker (可选)

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/xuexi-habit-app.git
cd xuexi-habit-app
```

### 2. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装前后端依赖
npm run install:all
```

### 3. 配置数据库

**方式一：Docker 启动数据库**

```bash
docker run -d \
  --name xuexi-postgres \
  -e POSTGRES_PASSWORD=xuexi123456 \
  -e POSTGRES_DB=xuexi \
  -p 5432:5432 \
  postgres:15-alpine
```

**方式二：本地 PostgreSQL**

创建数据库：

```sql
CREATE DATABASE xuexi;
```

### 4. 初始化数据库

```bash
cd backend
psql -U postgres -d xuexi -f ../docs/database.sql
```

### 5. 启动开发服务器

```bash
# 同时启动前端 + 后端
npm run dev
```

或分别启动：

```bash
# 终端1：启动后端 (端口 8080)
npm run dev:backend

# 终端2：启动前端 (端口 3000)
npm run dev:frontend
```

### 6. 访问应用

- 前端地址：http://localhost:3000
- 后端 API：http://localhost:8080
- API 文档：http://localhost:8080/api/health

## 🐳 Docker 部署

### 一键启动

```bash
# 启动所有服务
npm run docker:up

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 停止服务

```bash
npm run docker:down
```

## 📁 项目结构

```
xuexi-habit-app/
├── frontend/                 # Vue3 前端
│   ├── src/
│   │   ├── api/             # API 请求封装
│   │   ├── components/      # 公共组件
│   │   ├── pages/           # 页面组件
│   │   ├── stores/          # Pinia 状态管理
│   │   └── router/         # 路由配置
│   ├── public/              # 静态资源
│   └── package.json
│
├── backend/                  # Koa2 后端
│   ├── src/
│   │   ├── controllers/     # 业务逻辑
│   │   ├── routes/         # 路由定义
│   │   ├── config/         # 配置文件
│   │   └── utils/          # 工具函数
│   └── package.json
│
├── docs/                     # 项目文档
│   ├── database.sql        # 数据库建表脚本
│   └── api.md             # API 接口文档
│
├── docker-compose.yml        # Docker 编排
├── package.json             # 根目录 npm scripts
└── README.md
```

## 🌐 API 接口

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 当前用户 |

### 业务接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/family | 获取家庭信息 |
| GET | /api/goals | 获取目标列表 |
| POST | /api/goals | 创建目标 |
| GET | /api/tasks | 获取任务列表 |
| POST | /api/tasks | 创建任务 |
| POST | /api/tasks/:id/complete | 完成任务 |
| POST | /api/tasks/:id/skip | 跳过任务 |
| GET | /api/rewards | 获取奖励列表 |
| POST | /api/exchanges | 发起兑换 |
| GET | /api/achievements/stats | 获取成就统计 |

详细接口文档请查看 `docs/api.md`

## ⚙️ 环境变量

### 后端 (.env)

```bash
DATABASE_URL=postgresql://postgres:xuexi123456@localhost:5432/xuexi
PORT=8080
JWT_SECRET=your-super-secret-key-change-in-production
NODE_ENV=development
```

### 前端 (.env)

```bash
VITE_API_BASE_URL=/api
```

## 📝 开发指南

### 前端开发

```bash
cd frontend
npm run dev     # 开发模式 (热重载)
npm run build   # 生产构建
```

### 后端开发

```bash
cd backend
npm run dev     # 开发模式 (热重载)
npm start       # 生产模式
```

### 添加新的 API

1. 在 `backend/src/controllers/` 添加控制器
2. 在 `backend/src/routes/` 添加路由
3. 在 `frontend/src/api/` 添加前端请求封装

## 🎨 界面预览

| 首页 | 任务列表 | 奖励兑换 |
|:---:|:---:|:---:|
| 目标进度 + 今日任务 | 滑动完成/跳过 | 商品卡片 |

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

- 项目维护：fengs
- 服务器：腾讯云 100.114.91.23

---

⭐ 如果这个项目对你有帮助，请 star！
