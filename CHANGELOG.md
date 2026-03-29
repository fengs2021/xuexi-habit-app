# 更新日志

## [v1.3.0] - 2026-03-29

### ✨ 新功能

- **奖励编辑功能**
  - 家长可编辑已创建的奖励名称和积分
  - RewardCard 组件新增编辑按钮
  - 新增编辑弹窗和处理函数

- **学生完成任务直接掉落贴纸**
  - 学生点击"完成"时直接掉落贴纸（概率掉落）
  - 掉落时弹出精美贴纸弹窗（emoji + 名字 + 稀有度）
  - 家长审批时不再重复发放贴纸

- **头像抽奖系统**
  - 独立于贴纸的头像收集系统
  - 头像有专属稀有度和动画效果
  - 20次保底兑换机制

### 🐛 Bug 修复

- **北京时间显示 NaN 问题**
  - 原因：`toLocaleString('en-CA')` 返回12小时制格式，`split('T')` 解析失败
  - 修复：使用 `Intl.DateTimeFormat` 分离获取日期和时间再拼接
  - 影响：MobileLayout、DateTimeHeader 组件

- **任务积分修改无效**
  - 原因：前端发送 `starReward`，后端期望 `star_reward`
  - 修复：统一使用 `star_reward` 字段名

- **审批时重复发放贴纸**
  - 原因：学生完成 + 家长审批都发放贴纸
  - 修复：审批只发星星和成就，贴纸在完成时已发放

- **approveTaskLog 未定义变量**
  - 原因：`awardError` 在移除贴纸发放后未删除引用
  - 修复：移除未定义变量

- **宠物选择弹窗无法关闭**
  - 原因：`close-on-click-overlay="false"`
  - 修复：改为 `close-on-click-overlay` + `:overlay="true"`

- **创建奖励弹窗无法点击外部关闭**
  - 原因：缺少 `close-on-click-overlay` 属性
  - 修复：添加 `close-on-click-overlay`

### 🧹 代码清理

- **后端死代码清理**
  - 删除 `exchanges.js` 中废弃路由（`/pending`, `/approve`, `/reject`, `/history`）
  - 删除 `exchange.js` 中未使用函数（`rejectExchange`, `getExchangeHistory`, `getPendingExchanges`, `approveExchange` 重复）

- **前端死代码清理**
  - 删除 `task.js` 中未使用的 `approveTaskLog` API
  - 删除 `Task/index.vue` 中未使用的 `approveTaskLogApi` 导入

### 📄 文档

- API 文档更新至最新
- 新增死代码清理记录

---

## [v1.2.4] - 2026-03-26

### 🚀 新功能
- **积分明细 API** - 获取孩子积分明细和汇总
- **积分明细页面** - 审批页面新增积分明细标签
- **孩子选择器** - 支持切换查看不同孩子的积分

### 🎨 UI 更新
- **Claymorphism 橡皮泥风格** - 多层阴影、弹性动画、圆润边角
- Vant 组件全局圆角修复

### 🐛 Bug 修复
- 积分汇总API改用point_logs计算（修复数据不一致）
- 审批页面加载逻辑修复
- API路径重复导致404（`/api/api/points` → `/api/points`）

### 📄 文档
- API文档更新至 v3.6
- 删除旧版 API.md，整合到 api.md
- 新增贴纸抽奖接口文档
- 积分系统设计更新至 v2.1

### ⏰ 运维
- 新增积分一致性核查脚本
- 新增自动修复脚本
- 每天凌晨4点自动执行核查

---

## [v1.2.3] - 2026-03-25

### 📦 部署优化

- **初始数据SQL脚本**
  - `backend/sql/init-stickers.sql` - 贴纸初始数据（通用池+限定池）
  - `backend/sql/init-achievements.sql` - 成就初始数据（50个成就）
  - `backend/sql/init-data.sql` - 统一导入脚本
  - `docs/API.md` - API文档

### 使用方式
```bash
# 导入初始数据
psql -U postgres -d xuexi -f backend/sql/init-data.sql
```

---

## [v1.2.2] - 2026-03-25

### 🐛 Bug 修复

- **时区问题修复**
  - 签到接口 `/api/signin/*` 所有日期计算改用本地时区
  - 本周统计接口 `/api/statistics/week-summary` 修复 UTC 时区偏移

- **任务跳过功能移除**
  - 移除任务卡片的"跳过"按钮及滑动跳过功能

### ✨ 新功能

- **贴纸奖池系统**
  - 新增通用池 + 限定池设计
  - 限定池每周刷新

- **贴纸抽奖系统**
  - 消耗5积分抽取一次贴纸
  - 20次保底机制

---

## [v1.2.1] - 2026-03-25

### 🔒 安全修复

- JWT Secret 强化
- CORS 收紧
- 安全随机数

### 🛡️ 鲁棒性增强

- 数据库连接池配置
- 全局异常处理
- 进程守护 (PM2)

---

## [v1.2.0] - 2026-03-24

### ✨ 新功能

- 任务类型切换（每日/每周/一次性）
- 周一报告弹窗
- Docker 部署支持
- 开机自启动

---

## [v1.1.0] - 2026-03-21

### ✨ 新功能

- 连续打卡激励系统
- 幸运转盘系统
- 每周报告
- 数据导出备份
- 主题切换

---

## [v1.0.0] - 2026-03-20

### ✨ 首次发布

- 双角色系统（家长/孩子）
- 任务管理 + 审核评分
- 积分系统 + 愿望兑换
- 成就系统
- 贴纸系统
- 宠物系统
- 每日签到
- 统计页面
