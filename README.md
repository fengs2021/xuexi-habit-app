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
- 🏆 **成就系统** - 50种成就，4级稀有度（N/R/SR/SSR）
- 🎨 **贴纸系统** - 50种可爱贴纸，可装备展示在主页
- 📝 **每日签到** - 连续签到额外奖励（1,1,2,2,2,3,5循环）
- 📊 **统计页面** - 近30日积分获取历史
- 🐰 **小宠物** - 首页宠物根据任务进度展现不同表情
- 🔥 **连续打卡** - 连续3天/7天/30天激励徽章
- 🎰 **幸运转盘** - 每日转动抽奖
- 📅 **每周报告** - 自动生成本周学习总结
- 🎨 **主题切换** - 6种颜色主题
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
npm install
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
psql -U postgres -d xuexi -f ../docs/database.sql          # 建表脚本
psql -U postgres -d xuexi -f ./sql/init-data.sql           # 初始数据（贴纸+成就）
```

### 5. 启动开发服务器

```bash
# 同时启动前端 + 后端
npm run dev

# 或分别启动
npm run dev:backend  # 后端 (端口 8080)
npm run dev:frontend # 前端 (端口 3000)
```

### 6. 访问应用

- 前端地址：http://localhost:3000
- 后端 API：http://localhost:8080

## 📁 项目结构

```
xuexi-habit-app/
├── frontend/                 # Vue3 前端
│   └── src/
│       ├── api/             # API 请求封装
│       ├── components/       # 公共组件
│       ├── views/           # 页面视图
│       └── router/          # 路由配置
│
├── backend/                  # Koa2 后端
│   └── src/
│       ├── controllers/     # 业务逻辑
│       ├── routes/          # 路由定义
│       ├── services/        # 业务服务（积分服务等）
│       ├── config/          # 配置文件
│       └── utils/           # 工具函数
│
├── docs/                     # 项目文档
│   ├── database.sql        # 数据库建表脚本 (v3.6)
│   ├── api.md               # API 接口文档 (v3.6)
│   ├── 积分系统设计.md      # 积分系统设计文档 (v2.1)
│   └── 项目详细设计文档.md   # 详细设计文档
│
├── docker-compose.yml        # Docker 编排
└── README.md
```

## 🌟 积分系统 v2.1

统一积分管理，支持完整追溯。

### 设计原则

1. **积分日志为权威数据源** - `point_logs` 的 SUM(amount) 作为权威余额
2. **完整追溯** - `point_logs` 记录所有变动流水
3. **事务保证** - 余额和日志同时更新
4. **一致性验证** - 每日自动核查，发现问题自动修复

### 积分类型

| Type | 说明 | 方向 |
|------|------|------|
| `signin` | 每日签到 | earn |
| `task_approve` | 任务完成 | earn |
| `achievement` | 成就奖励 | earn |
| `wheel` | 转盘中奖 | earn |
| `exchange` | 兑换奖励 | spend |
| `pet_care` | 宠物照顾 | spend |
| `deduct` | 惩罚扣分 | spend |
| `reverse` | 撤销返还 | earn |

### 数据校验

```sql
-- 检查积分一致性
SELECT * FROM point_consistency_check WHERE status = '❌ 不一致';
```

详细文档请查看 `docs/积分系统设计.md`

## 🌟 功能详解

### 🏆 成就系统

| 等级 | 稀有度 | 数量 |
|------|--------|------|
| SSR | 传说 | 10种 |
| SR | 超稀有 | 10种 |
| R | 稀有 | 10种 |
| N | 普通 | 20种 |

### 🎨 贴纸系统

- 70种贴纸（N/R/SR/SSR 4级稀有度）
- 通用池（长期）+ 限定池（每周刷新）
- 支持装备2张展示在首页
- 贴纸抽奖系统（5积分/次，20次保底）

### 📝 签到奖励

| 连续天数 | 1 | 2 | 3 | 4 | 5 | 6 | 7+ |
|---------|---|---|---|---|---|---|----|
| 奖励★   | 1 | 1 | 2 | 2 | 2 | 3 | 5 |

### 🐰 小宠物

- 根据今日任务完成进度展现不同表情
- 6种宠物可解锁（亲密度达到要求）
- 宠物照顾消耗星星

## ⚙️ 环境变量

### 后端 (.env)

```bash
DATABASE_URL=postgresql://postgres:xuexi123456@localhost:5432/xuexi
PORT=8080
JWT_SECRET=your-super-secret-key-change-in-production
```

### 前端 (.env)

```bash
VITE_API_BASE_URL=/api
```

## 📝 开发指南

### 前端开发

```bash
cd frontend
npm run dev     # 开发模式
npm run build   # 生产构建
```

### 后端开发

```bash
cd backend
npm run dev     # 开发模式
npm start       # 生产模式
```

### 添加新的 API

1. 在 `backend/src/controllers/` 添加控制器
2. 在 `backend/src/routes/` 添加路由
3. 在 `frontend/src/api/` 添加前端请求封装

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

⭐ 如果这个项目对你有帮助，请 star！

## 📝 更新日志

### 2026-03-26 v3.6

**积分明细功能 + 文档整合**

- 🚀 **积分明细 API** - 新增 `/api/points/child-logs/:childId` 和 `/api/points/child-summary/:childId`
- 📱 **积分明细页面** - 审批页面新增"积分明细"标签，支持查看孩子积分获取和使用记录
- 👶 **孩子选择器** - 积分概览支持下拉选择不同孩子
- 🎨 **Claymorphism UI** - 超强橡皮泥风格UI
- 🐛 **Bug 修复**
  - 积分汇总API从point_logs计算余额（修复users表数据不一致问题）
  - 审批页面加载逻辑修复
  - API路径重复导致404问题
- 📄 **文档更新** - API文档更新至 v3.6，整合旧版API.md
- ⏰ **一致性保障** - 新增积分一致性核查脚本（每天凌晨4点自动执行）


### 2026-03-25 v3.3

**积分系统 v2.0 重大升级**

- 🚀 **统一积分服务** - 新增 `services/points.js`，所有积分操作统一管理
- 📜 **完整追溯** - 新增 `point_logs` 表，记录所有积分变动流水
- ✅ **一致性保证** - 事务保证余额和日志同时更新
- 🔧 **数据校验** - 提供校验视图和修复函数

**Bug 修复**

- 修复审批页面贴纸不掉落的问题
- 修复统计页面任务显示"已跳过"的问题
- 修复宠物名称显示"小宠物"的问题（添加 anna.jpg 映射）
- 清理所有调试日志

**代码优化**

- 统一积分管理，所有模块使用相同接口
- 签到、审批、兑换、宠物、转盘等模块全面重构
- API 文档更新至 v3.3

### 2026-03-24

- 每周报告功能
- 数据导出备份
- 登录页家长注册入口恢复
- 统计页面横向柱状图
- 新奖励弹窗提醒

### 2026-03-21

- 完成初始版本开发
