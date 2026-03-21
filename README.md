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
- 🎁 **奖励兑换** - 丰富的奖励商品库，家长审批后生效
- 🏆 **成就系统** - 18种成就，5级稀有度（青铜/白银/黄金/钻石）
- 🎨 **贴纸系统** - 50种可爱贴纸，可装备展示在主页
- 📝 **每日签到** - 连续签到额外奖励（1,1,2,2,2,3,5循环）
- 📊 **统计页面** - 近30日积分获取历史（横向柱状图+详情列表）
- 🐰 **小宠物** - 首页宠物根据任务进度展现不同表情
- 🔥 **连续打卡** - 连续3天/7天/30天激励徽章
- 🎰 **幸运转盘** - 每日转动抽奖（贴纸/星星/再来一次）
- 📅 **每周报告** - 自动生成本周学习总结
- 🎨 **主题切换** - 6种颜色主题（粉色/蓝色/黄色/紫色/绿色/橙色）
- 💾 **数据导出** - 个人和家庭数据备份下载
- 👨👩👧👦 **家庭管理** - 支持多个孩子、家长管理

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
│   │   │   ├── TaskCard.vue       # 任务卡片
│   │   │   ├── SigninCard.vue     # 签到卡片
│   │   │   └── PetCompanion.vue    # 小宠物组件
│   │   ├── views/           # 页面视图
│   │   │   ├── Dashboard/         # 首页
│   │   │   ├── Task/             # 任务页
│   │   │   ├── Reward/            # 奖励页
│   │   │   ├── Statistics/       # 统计页
│   │   │   ├── Family/            # 家庭页
│   │   │   └── Profile/           # 个人页
│   │   ├── layout/          # 布局组件
│   │   │   └── MobileLayout.vue   # 移动端布局(含Header徽章)
│   │   ├── stores/          # Pinia 状态管理
│   │   └── router/          # 路由配置
│   └── package.json
│
├── backend/                  # Koa2 后端
│   ├── src/
│   │   ├── controllers/      # 业务逻辑
│   │   ├── routes/          # 路由定义
│   │   │   ├── achievements.js   # 成就路由
│   │   │   ├── stickers.js        # 贴纸路由
│   │   │   ├── display.js         # 展示设置路由
│   │   │   ├── signin.js         # 签到路由
│   │   │   └── statistics.js      # 统计路由
│   │   ├── config/          # 配置文件
│   │   └── utils/           # 工具函数
│   └── package.json
│
├── docs/                     # 项目文档
│   ├── database.sql         # 数据库建表脚本
│   ├── api.md              # API 接口文档
│   └── 项目详细设计文档.md   # 详细设计文档
│
├── docker-compose.yml        # Docker 编排
├── package.json             # 根目录 npm scripts
└── README.md
```

## 🌟 新功能详解

### 🏆 成就系统

| 等级 | 颜色 | 成就示例 |
|------|------|---------|
| 钻石 | 紫色发光 | 任务之王、星星富翁 |
| 黄金 | 金色渐变 | 坚持之星、目标达成者 |
| 白银 | 银色脉冲 | 小坚持、早起鸟 |
| 青铜 | 铜色阴影 | 初养成、小试牛刀 |

### 🎨 贴纸系统

- **50种贴纸**：N(20)、R(15)、SR(10)、SSR(5)
- 可装备2张贴纸显示在首页Header
- 按稀有度有不同的展示效果

### 📝 签到奖励

| 连续天数 | 1 | 2 | 3 | 4 | 5 | 6 | 7+ |
|---------|---|---|---|---|---|---|----|
| 奖励★   | 1 | 1 | 2 | 2 | 2 | 3 | 5 |

### 🐰 小宠物

- 根据今日任务完成进度展现不同表情
- 点击宠物会获得随机鼓励话语
- 宠物表情：😢 → 😐 → 😊 → 🤩 → 🎉

## 🌐 API 接口

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register/parent | 家长注册 |
| POST | /api/auth/login/parent | 家长登录 |
| POST | /api/auth/register/child | 孩子注册(设备码) |
| POST | /api/auth/login/device | 设备登录 |
| GET | /api/auth/me | 当前用户信息 |

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
| PUT | /api/exchanges/:id/approve | 审批兑换 |

### 新功能接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/achievements | 获取成就列表 |
| GET | /api/stickers | 获取贴纸列表 |
| GET | /api/display/settings/:userId | 获取展示设置 |
| PUT | /api/display/settings | 更新展示设置 |
| GET | /api/signin/info/:userId | 获取签到信息 |
| POST | /api/signin/checkin | 执行签到 |
| GET | /api/statistics/daily-stars/:childId | 近30日积分 |

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

| 首页 | Header徽章 | 成就墙 |
|:---:|:---:|:---:|
| 目标进度 + 宠物 + 签到 | 成就 + 贴纸 | 5级稀有度展示 |

| 任务列表 | 统计页面 | 个人页 |
|:---:|:---:|:---:|
| 滑动完成/跳过 | 近30日趋势 | 成就/贴纸/展示设置 |

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

- 项目维护：fengs
- 服务器：腾讯云 100.114.91.23

---

⭐ 如果这个项目对你有帮助，请 star！

## 📝 更新日志

### 2026-03-21
- **每周报告**：每周日晚自动生成，周一打开弹框提醒
- **数据导出备份**：家长可导出个人数据或备份整个家庭数据为JSON文件
- **登录页**：恢复被误删的家长注册入口
- **统计页面**：
  - 近30日积分改为横向柱状图展示，支持左右滑动
  - 新增任务完成详情，按日分组显示完成任务，下拉加载更多
- **新奖励弹窗**：获得成就或贴纸时弹出醒目恭喜提醒（24小时内有效，每日只弹一次）
- **后端API**：新增 API 接口

### 2026-03-20
- 完成初始版本开发
