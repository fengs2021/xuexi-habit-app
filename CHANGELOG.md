# 更新日志

## [v1.2.1] - 2026-03-25

### 🔒 安全修复

- **JWT Secret 强化**
  - 生产环境必须设置 JWT_SECRET 环境变量，否则拒绝启动
  - 开发环境使用默认密钥但会警告

- **CORS 收紧**
  - 生产环境必须设置 ALLOWED_ORIGIN，否则拒绝跨域

- **安全随机数**
  - Math.random() 替换为 crypto.randomUUID() / crypto.randomBytes()
  - 影响：设备ID生成、家庭邀请码生成、转盘中奖

- **敏感日志**
  - 生产环境禁止打印数据库配置

- **前端 Token 刷新**
  - 添加完整的 Token 自动刷新机制
  - 防止 401 时直接登出

### 🛡️ 鲁棒性增强

- **数据库连接池**
  - max: 20 连接
  - idleTimeoutMillis: 30s
  - connectionTimeoutMillis: 5s
  - 每60秒健康检查

- **全局异常处理**
  - uncaughtException 捕获
  - unhandledRejection 捕获
  - 优雅关闭 (SIGTERM/SIGINT)

- **进程守护**
  - PM2 配置 ecosystem.config.js
  - 崩溃自动重启
  - 开机自启动

### 🐛 Bug 修复

- **任务状态查询**
  - 家长任务页面查询孩子的完成状态（而非家长自己的）
  - 任务页面/审批页面使用不同的 API
  - 新增 `/api/tasks/cycle-status` API

- **转盘刷新时间**
  - 从 UTC 00:00 改为北京时间 00:00

- **审批页面**
  - 不限时间显示所有 pending 记录

- **统计页面**
  - 修复使用家长ID查询而非孩子ID的问题
  - 正确使用 URL childId 参数

- **家长首页**
  - 显示孩子的宠物头像（cartoon头像优先，其次emoji宠物）

- **家庭进度查询**
  - 修复 action='completed' 改为 'complete'
  - 修复周完成数使用周一零点

### 🧹 代码清理

- **删除宠物养护死代码**
  - 删除 `api/pet.js`（未被使用）
  - 删除 `routes/pet.js`（喂食/洗澡等功能）
  - 移除 PET_CARE 积分类型

- **删除重复兑换审批API**
  - 前端 `api/exchange.js` 已删除
  - 统一使用 `/api/approvals/*` 入口

### 🔧 代码质量

- **硬编码 URL**
  - 改为使用 `VITE_API_BASE_URL` 环境变量

- **调试日志**
  - 移除所有 console.log 调试日志

- **后端响应格式**
  - signin.js、display.js 统一使用 `error()`/`success()` 辅助函数

---

## [v1.2.0] - 2026-03-24

### ✨ 新功能

- **任务类型切换**
  - 家长任务管理页面支持点击切换任务类型（每日↔每周↔一次性）
  - 自动保存到数据库 `tasks.frequency` 字段
  - 新增 `once`（一次性）任务类型

- **上周报告弹窗（周一）**
  - 周一首次打开统计页面时弹出上周习惯报告
  - 显示上周完成任务数、获得星星、签到天数
  - 对比上上周数据（多做/少做几个任务）
  - 每周只弹一次（localStorage 记录）

- **实时余额刷新**
  - 头部累计和余额每5秒自动刷新
  - 完成任务/签到/兑换后余额即时更新

- **Docker 部署支持**
  - 新增 `frontend/Dockerfile` 和 `frontend/nginx/nginx.conf`
  - 提供 `docker-compose.yml` 快速部署
  - 提供 `start-all.sh` 一键启动脚本

- **系统服务守护**
  - systemd 服务配置：`xuexi-postgres`, `xuexi-backend`, `xuexi-frontend`
  - Docker 容器 `unless-stopped` 重启策略
  - 开机自启动配置（rc.local）

### 🐛 修复

- **数据库连接**
  - 修复 `database.js` 硬编码 `localhost` 问题
  - 支持 `DATABASE_URL` 环境变量配置
  - Docker 网络环境使用 `db` 作为主机名

- **签到奖励计入统计**
  - 修复签到奖励未计入 `user_point_summary` 问题
  - 修复签到后 `users.stars` 和 `users.total_stars` 重复累加问题

- **成就奖励计入统计**
  - 修复成就解锁奖励未计入 `user_point_summary` 问题

- **周报数据结构**
  - 修复后端返回 `data.data.summary` 嵌套过深问题
  - 扁平化返回数据，前端直接使用 `summary.completed`

- **数据库表结构**
  - 补全 `user_signins.streak_days`, `bonus_stars` 字段
  - 补全 `user_display_settings.pet`, `theme`, `equipped_sticker1_id`, `equipped_sticker2_id` 字段
  - 补全 `spin_wheel_prizes.emoji`, `user_daily_spins.prize_id`, `prize_name` 字段
  - 补全 `weekly_reports.viewed`, `data` 字段
  - 修复 `tasks.frequency` CHECK 约束（支持 daily/weekly/special/once）

- **宠物保存**
  - 修复宠物选择保存失败问题（缺少数据库字段）

### ⚡ 优化

- **周报逻辑**
  - 默认显示本周报告
  - 周一弹窗显示上周报告，对比上上周数据
  - 支持 `type=last` 查询参数获取上周报告

- **贴纸系统**
  - 50种贴纸数据初始化（N/R/SR/SSR 稀有度）
  - 用户贴纸关联表 `user_stickers`

- **成就系统**
  - 24种成就定义补全
  - 支持成就解锁时自动发放星星奖励

---

## [v1.1.2] - 2026-03-21

### 🐛 修复

- **积分汇总系统**：新建 `user_point_summary` 表，累计积分和已使用积分分开存储
- **积分计算**：余额 = 累计积分 - 已使用积分，每次获积分/兑换自动更新
- **家长首页**：显示家庭成员任务进度（今日完成/本周完成/待审批）
- **家长任务页**：改为按每日/每周/特殊任务分类，不再分进行中/已完成
- **导航栏**：加载时刷新用户信息，显示正确的累计和余额

---

## [v1.1.1] - 2026-03-21

### 🐛 修复

- **任务星级显示**：修复任务星级默认为1的问题，数据库star_reward字段正确映射
- **任务完成提交**：修复学生提交任务后无法审批的问题（emit id而非整个task对象）
- **审批状态同步**：修复家长拒绝任务后学生端仍显示已完成的问题
- **API响应处理**：修复axios拦截器对code:200的判断（原来只认code:0）
- **统计准确性**：统计页面只计算审批通过的任务，拒绝的任务不计入

### ⚡ 优化

- 添加空值防护，避免undefined导致页面报错

---

## [v1.1.0] - 2026-03-21

### ✨ 新功能

- **连续打卡激励系统**
  - 新增 `users.current_streak`, `users.longest_streak`, `users.last_checkin_date` 字段
  - 连续3天🔥 / 7天✨ / 30天🏆 显示不同徽章
  - 新增后端API：`/api/streak/:childId`, `/api/streak/checkin/:childId`

- **幸运转盘系统**
  - 每日一次转动机会
  - 奖品：星星×2/3/5、随机贴纸(N/R/SR/SSR)、再来一次、谢谢参与
  - 前端组件：`SpinWheel.vue`，旋转动画+弹窗展示
  - 新增表：`spin_wheel_prizes`, `user_daily_spins`

- **每周报告**
  - 自动生成周报（完成天数、获得星星、任务完成率）
  - 前端顶部显示本周报告入口
  - 新增表：`weekly_reports`

- **数据导出备份**
  - 个人数据导出：`/api/backup/export/:userId`
  - 家庭数据导出：`/api/backup/family/:familyId`
  - 前端"我的"页面入口

- **主题切换**
  - 6种明亮主题：粉色、蓝色、黄色、紫色、绿色、橙色
  - 使用CSS变量 `applyTheme(themeId)`
  - 偏好保存到 `user_display_settings.theme`

### 🐛 修复

- 修复打卡日历日期显示问题（居中当天日期）
- 修复安全漏洞：JWT_SECRET密钥强化
- 修复 rewards.js 无错误处理问题
- 修复 approveTaskLog 缺少事务问题
- 修复 CORS 配置（支持环境变量 ALLOWED_ORIGIN）

### ⚡ 优化

- 统计页面：横向柱状图 + 每日任务详情列表
- 新成就/贴纸弹窗祝贺动画（星星散射+纸屑）
- 前端 Header 成就徽章和贴纸布局优化

---

## [v1.0.0] - 2026-03-20

### ✨ 首次发布

- 双角色系统（家长/孩子）
- 任务管理 + 审核评分
- 积分系统 + 愿望兑换
- 成就系统（18种成就）
- 贴纸系统（50种贴纸）
- 宠物系统
- 每日签到
- 统计页面
