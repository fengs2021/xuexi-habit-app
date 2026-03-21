# 更新日志

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

## [v1.1.1] - 2026-03-21

### 🐛 修复

- **任务星级显示**：修复任务星级默认为1的问题，数据库star_reward字段正确映射
- **任务完成提交**：修复学生提交任务后无法审批的问题（emit id而非整个task对象）
- **审批状态同步**：修复家长拒绝任务后学生端仍显示已完成的问题
- **API响应处理**：修复axios拦截器对code:200的判断（原来只认code:0）
- **统计准确性**：统计页面只计算审批通过的任务，拒绝的任务不计入

### ⚡ 优化

- 添加空值防护，避免undefined导致页面报错

