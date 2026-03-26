# API 接口文档 v3.6

> 与代码版本完全一致 | 最后更新: 2026-03-26

---

## 重要更新 (v3.4)

### 任务完成状态查询分离

由于家长端需要同时查看「已完成」和「待审批」状态，任务相关的状态查询已分离为两个独立的 API：

| API | 用途 | 返回内容 |
|-----|------|---------|
| `GET /api/tasks/student-status` | 审批页面专用 | 所有 pending 记录（不限时间） |
| `GET /api/tasks/cycle-status` | 任务页面专用 | 本周期的 approved + pending 记录 |

### 积分明细接口 (v3.5)

新增积分明细相关 API，支持查看孩子的积分获取和使用记录：

| API | 用途 |
|-----|------|
| `GET /api/points/child-logs/:childId` | 获取积分明细列表 |
| `GET /api/points/child-summary/:childId` | 获取积分汇总（余额/累计获得/累计消费） |

### 时间周期说明

- **每日任务**：以北京时间 00:00 为新的一天开始
- **每周任务**：以北京时间周一 00:00 为本周开始
- **转盘**：以北京时间 00:00 为新的一天开始

---

## 基础信息

- **基础 URL**: `/api`
- **响应格式**: JSON
- **认证方式**: Bearer Token (JWT)
- **错误码**: 统一使用 `{ code, message, data }` 格式

---

## 通用响应格式

```json
// 成功
{ "code": 0, "message": "success", "data": {} }

// 错误
{ "code": 1001, "message": "参数错误", "data": null }
```

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 未登录 |
| 1003 | 无权限 |
| 2001 | 用户不存在 |
| 2002 | 家庭不存在 |
| 3001 | 目标不存在 |
| 3002 | 任务不存在 |
| 3003 | 星星不足 |

---

## 目录

- [认证接口](#认证接口)
- [家庭接口](#家庭接口)
- [目标接口](#目标接口)
- [任务接口](#任务接口)
- [奖励接口](#奖励接口)
- [兑换接口](#兑换接口)
- [审批接口](#审批接口)
- [积分明细接口](#积分明细接口)
- [成就接口](#成就接口)
- [签到接口](#签到接口)
- [连续打卡接口](#连续打卡接口)
- [统计接口](#统计接口)
- [贴纸接口](#贴纸接口)
- [贴纸抽奖接口 (Sticker Lottery)](#贴纸抽奖接口-sticker-lottery)
- [宠物接口](#宠物接口)
- [转盘接口](#转盘接口)
- [周报接口](#周报接口)
- [展示设置接口](#展示设置接口)
- [头像接口](#头像接口)
- [备份接口](#备份接口)

---

## 认证接口

### POST /api/auth/register/parent
**家长注册**

```json
// 请求
{
  "phone": "手机号",
  "password": "密码",
  "nickname": "昵称",
  "familyName": "家庭名称(可选)",
  "inviteCode": "邀请码(可选，已有家庭时填)"
}

// 响应
{
  "code": 0,
  "data": {
    "token": "jwt-token",
    "refreshToken": "refresh-token",
    "user": {
      "id": "uuid",
      "nickname": "昵称",
      "role": "admin",
      "familyId": "uuid",
      "familyName": "家庭名称",
      "level": 1,
      "stars": 0
    }
  }
}
```

### POST /api/auth/register/child
**孩子注册**

```json
// 请求
{ "inviteCode": "家庭邀请码", "nickname": "孩子昵称" }

// 响应
{ "code": 0, "data": { "token": "...", "refreshToken": "...", "user": {...} } }
```

### POST /api/auth/login/parent
**家长登录**

```json
// 请求
{ "phone": "手机号", "password": "密码" }
```

### POST /api/auth/login/device
**设备登录（免密码）**

```json
// 请求
{ "deviceId": "设备ID" }  // 或 { "userId": "用户UUID" }
```

### POST /api/auth/logout
**退出登录**

```json
// 请求（无需参数）
{}
```

### POST /api/auth/refresh
**刷新 Token**

```json
// 请求
{ "refreshToken": "refresh-token" }
```

### GET /api/auth/me
**获取当前用户信息**（需认证）

---

## 家庭接口

### GET /api/family
**获取家庭信息**（需认证）

### PUT /api/family
**更新家庭信息**（需认证）

```json
{ "name": "新家庭名称" }
```

### POST /api/family/child
**添加孩子**（家长，需认证）

```json
{ "nickname": "孩子昵称" }
```

### GET /api/family/children
**获取所有孩子列表**（需认证）

### GET /api/family/by-code/:code
**通过邀请码获取家庭信息**

### POST /api/family/invite
**生成/获取家庭邀请码**（需认证）

### GET /api/family/children-task-progress
**获取所有孩子今日任务进度**（家长，需认证）

### DELETE /api/family/member/:userId
**移除家庭成员**（家长，需认证）

---

## 目标接口

### GET /api/goals
**获取目标列表**（需认证）

### POST /api/goals
**创建目标**（需认证）

```json
{
  "title": "目标名称",
  "icon": "图标",
  "difficulty": 10,
  "userId": "用户UUID(可选，为空表示通用目标)"
}
```

### PUT /api/goals/:id
**更新目标**（需认证）

```json
{
  "title": "新名称",
  "icon": "新图标",
  "difficulty": 15,
  "starTarget": 20,
  "status": "active|completed|abandoned",
  "currentStars": 5
}
```

### DELETE /api/goals/:id
**删除目标（软删除）**（需认证）

---

## 任务接口

### GET /api/tasks
**获取任务列表**（需认证）

```json
// 响应
{
  "code": 0,
  "data": {
    "daily": [{ "id": "uuid", "title": "按时起床", "completed": false, "pendingApproval": false, ... }],
    "weekly": [...],
    "special": [...]
  }
}
```

### POST /api/tasks
**创建任务**（家长，需认证）

```json
{
  "title": "任务名称",
  "starReward": 2,
  "frequency": "daily|weekly|once",
  "rarity": "N|R|SR|SSR",
  "icon": "图标",
  "goalId": "目标UUID(可选)"
}
```

### PUT /api/tasks/:id
**更新任务**（家长，需认证）

### DELETE /api/tasks/:id
**删除任务（软删除）**（家长，需认证）

### POST /api/tasks/:id/complete
**完成任务**（孩子，需认证）

> ⚠️ 会检查本周期是否已提交，防止重复

### POST /api/tasks/:id/skip
**跳过任务**（孩子，需认证）

> ⚠️ 会检查本周期是否已操作

### GET /api/tasks/student-status
**获取学生待审批任务列表**（家长，审批页面专用）

> ⚠️ 返回所有 pending 状态的记录，不限时间范围

```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "user_id": "孩子UUID",
      "task_id": "任务UUID",
      "action": "complete",
      "approval_status": "pending",
      "stars_earned": 2,
      "user_nickname": "瑶瑶",
      "task_title": "练字",
      "frequency": "daily",
      "created_at": "2026-03-25T..."
    }
  ]
}
```

### GET /api/tasks/cycle-status
**获取本周期的任务完成状态**（家长，任务页面专用）

> ⚠️ 返回本周期的 approved + pending 记录，用于任务页面显示「已完成」和「待审批」

```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "user_id": "孩子UUID",
      "task_id": "任务UUID",
      "action": "complete",
      "approval_status": "approved",  // 或 "pending"
      "stars_earned": 2,
      "user_nickname": "瑶瑶",
      "task_title": "练字",
      "frequency": "daily",
      "created_at": "2026-03-25T..."
    }
  ]
}
```

### POST /api/tasks/log/:id/approve
**审批任务**（家长，需认证）

```json
{ "approved": true, "taskType": "daily" }
```

### POST /api/tasks/deduct
**扣减学生星星**（家长，需认证）

```json
{ "studentId": "uuid", "stars": 5, "reason": "原因" }
```

---

## 奖励接口

### GET /api/rewards
**获取奖励列表**（需认证）

### POST /api/rewards
**创建奖励**（家长，需认证）

```json
{ "title": "奖励名称", "starCost": 30, "rarity": "normal", "icon": "图标" }
```

### PUT /api/rewards/:id
**更新奖励**（需认证）

```json
{ "title": "新名称", "starCost": 25, "isActive": true, "sortOrder": 1 }
```

### DELETE /api/rewards/:id
**删除奖励（软删除）**（需认证）

---

## 兑换接口

### POST /api/exchanges
**发起兑换**（孩子，需认证）

```json
{ "rewardId": "奖励UUID" }
```

### GET /api/exchanges/history
**获取兑换历史**（需认证）

```json
// 可选查询参数
?childId=uuid  // 家长可指定查看某个孩子的记录
```

### GET /api/exchanges/student-history
**获取所有孩子兑换记录**（家长，需认证）

---

## 审批接口

> ✅ 统一的审批入口，用于审批任务和兑换
> 
> ⚠️ 兑换审批推荐使用 `/api/approvals/*` 入口

### GET /api/approvals/pending
**获取所有待审批项目**（任务 + 兑换）

### GET /api/approvals/history
**获取审批历史**

```json
{
  "code": 0,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "task_id": "uuid",
        "action": "complete",        // 动作类型：complete(已完成)/skipped(已跳过)
        "stars_earned": 1,
        "approval_status": "approved",
        "task_title": "按时起床",
        "user_nickname": "瑶瑶",
        "created_at": "2026-03-25T10:00:00Z"
      }
    ],
    "exchanges": [...]
  }
}
```

### PUT /api/approvals/task/:id
**审批任务**

```json
{ "approved": true }
```

### PUT /api/approvals/exchange/:id
**审批兑换**

```json
{ "approved": true }
```

### PUT /api/approvals/reverse/:id
**撤销已批准的审批**

```json
{ "type": "task" | "exchange" }
```

---

## 积分明细接口

### GET /api/points/child-logs/:childId
**获取孩子积分明细记录**（需认证）

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "uuid",
        "amount": 1,                    // 积分变动（正数获得，负数消费）
        "balance_after": 75,           // 变动后余额
        "type": "task_approve",         // 类型：signin/task_approve/achievement/wheel/exchange/lottery/deduct/adjust
        "source": "task_log",
        "description": "完成任务：按时起床",  // 描述
        "created_at": "2026-03-26T10:00:00Z",
        "childNickname": "瑶瑶"         // 孩子昵称（多孩子时区分）
      }
    ],
    "total": 23,                     // 总记录数
    "hasMore": false                  // 是否有更多
  }
}
```

### GET /api/points/child-summary/:childId
**获取孩子积分汇总**（需认证）

```json
{
  "code": 0,
  "data": {
    "currentBalance": 75,              // 当前余额
    "totalEarned": 100,               // 累计获得
    "totalSpent": 25,                 // 累计消费
    "byType": [                       // 按类型分类
      {
        "type": "task_approve",
        "earned": 80,
        "spent": 0,
        "count": 15
      }
    ]
  }
}
```

---

## 成就接口

### GET /api/achievements
**获取所有成就定义**（需认证）

### GET /api/achievements/user/:userId
**获取用户已解锁的成就**

---

## 签到接口

### GET /api/signin/info/:userId
**获取用户签到信息**

```json
{
  "code": 0,
  "data": {
    "checkedIn": false,        // 今天是否已签到
    "streakDays": 3,           // 当前连续天数
    "todayBonus": 2,          // 今日签到可获奖励
    "canClaim": true,         // 是否可以签到
    "monthDays": [1, 2, 3, 5] // 本月已签到的日期
  }
}
```

> 签到奖励规则：1,1,2,2,2,3,5（七天循环）

### POST /api/signin/checkin
**执行签到**

```json
{ "userId": "uuid" }

// 响应
{
  "code": 0,
  "data": {
    "streakDays": 4,
    "bonusStars": 2,
    "totalStars": 15
  }
}
```

### GET /api/signin/history/:userId
**获取签到历史**

---

## 连续打卡接口

### GET /api/streak/:childId
**获取连续打卡信息**

```json
{
  "code": 0,
  "data": {
    "currentStreak": 3,
    "longestStreak": 7,
    "checkedInToday": false,
    "lastCheckinDate": "2026-03-20",
    "todayBonus": 0
  }
}
```

> ⚠️ 数据来源于签到系统，本接口为只读

### GET /api/streak/:childId/achievements
**获取连续打卡成就进度**

---

## 统计接口

### GET /api/statistics/daily-stars/:childId
**获取近30日每日积分统计**

```json
{
  "code": 0,
  "data": [
    { "date": "3月24日", "dateKey": "2026-03-24", "stars": 10 },
    ...
  ]
}
```

### GET /api/statistics/daily-tasks/:childId
**获取每日任务完成详情**

```json
// 查询参数: ?offset=0&limit=7
{
  "code": 0,
  "data": {
    "items": [...],
    "totalDays": 30,
    "hasMore": true
  }
}
```

### GET /api/statistics/new-rewards/:childId
**获取24小时内新获得的成就和贴纸**

```json
{
  "code": 0,
  "data": {
    "achievements": [...],
    "stickers": [...],
    "hasNew": true
  }
}
```

### GET /api/statistics/week-summary/:childId
**获取本周统计数据**

```json
{
  "code": 0,
  "data": {
    "weekStart": "2026-03-23",
    "today": "2026-03-24",
    "tasksCompleted": 10,
    "tasksSkipped": 2,
    "completionRate": 83,
    "starsEarned": 12,
    "signinDays": 5
  }
}
```

---

## 贴纸接口

### GET /api/stickers
**获取所有贴纸列表**

### GET /api/stickers/user/:userId
**获取用户拥有的贴纸**

### GET /api/stickers/user/:userId/ids
**获取用户拥有的贴纸ID列表**

---

## 宠物接口

### GET /api/pet/info/:userId
**获取宠物信息**

```json
{
  "code": 0,
  "data": {
    "pet_type": "rabbit",
    "hunger": 100,
    "cleanliness": 100,
    "mood": 100,
    "intimacy": 0,
    "pet_level": 1
  }
}
```

### POST /api/pet/care
**照顾宠物**

```json
{ "userId": "uuid", "action": "feed|bath|park|sleep" }

// 响应
{
  "code": 0,
  "data": {
    "hunger": 100,
    "cleanliness": 100,
    "mood": 100,
    "intimacy": 3,
    "petLevel": 1,
    "actionCost": 5,
    "actionName": "喂食",
    "unlockedPets": ["rabbit"]
  }
}
```

| action | 消耗星星 | 饱腹 | 清洁 | 心情 | 亲密度 |
|--------|---------|------|------|------|-------|
| feed | 5 | +30 | 0 | +5 | +3 |
| bath | 8 | 0 | +25 | +10 | +4 |
| park | 10 | -5 | -10 | +35 | +5 |
| sleep | 3 | -10 | 0 | +20 | +2 |

### PUT /api/pet/change
**更换宠物**

```json
{ "userId": "uuid", "petType": "fox" }
// 需要亲密度达到解锁要求
```

### GET /api/pet/all/:userId
**获取所有宠物及解锁状态**

| 宠物 | 解锁亲密度 | Emoji |
|------|----------|-------|
| 兔子 | 0 | 🐰 |
| 狐狸 | 50 | 🦊 |
| 猫 | 100 | 🐱 |
| 狗 | 150 | 🐶 |
| 熊 | 250 | 🐻 |
| 熊猫 | 400 | 🐼 |

---

## 贴纸抽奖接口 (Sticker Lottery)

### GET /api/sticker-lottery/weekly-limited
**获取本周限定贴纸**

### GET /api/sticker-lottery/progress/:userId
**获取用户抽奖进度**

```json
{
  "code": 0,
  "data": {
    "drawsToday": 0,       // 今日抽奖次数
    "totalDraws": 5,       // 今日总次数
    "guaranteeProgress": 3 // 保底进度（满5次必中）
  }
}
```

### POST /api/sticker-lottery/draw/:userId
**执行抽奖**

```json
{
  "code": 0,
  "data": {
    "sticker": {
      "id": "uuid",
      "name": "限定贴纸名称",
      "rarity": "rare",
      "imageUrl": "..."
    },
    "isGuaranteed": false,  // 是否保底触发
    "guaranteeProgress": 4  // 抽奖后保底进度
  }
}
```

### POST /api/sticker-lottery/guarantee-exchange/:userId
**保底兑换指定贴纸**

```json
{
  "stickerId": "uuid"
}
```

### GET /api/sticker-lottery/exchange-options/:userId
**获取可选兑换列表（保底兑换）**

---

## 转盘接口

### GET /api/wheel/config
**获取转盘配置和奖品列表**

### GET /api/wheel/today/:userId
**检查今日是否已转动转盘**

```json
{ "code": 0, "data": { "spun": true, "spinRecord": {...} } }
```

### POST /api/wheel/spin/:userId
**转动转盘**

```json
// 响应
{
  "code": 0,
  "data": {
    "prize": { "id": "uuid", "name": "2星", "emoji": "⭐", "type": "stars" },
    "reward": { "type": "stars", "value": 2 }
  }
}
```

---

## 周报接口

### GET /api/report/weekly/:childId
**获取周报**

```json
// 查询参数: ?type=last 获取上周报告
{
  "code": 0,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "week_start": "2026-03-16",
    "week_end": "2026-03-22",
    "user_nickname": "瑶瑶",
    "summary": {
      "total_tasks": 14,
      "completed": 10,
      "skipped": 2,
      "completion_rate": 71,
      "stars_earned": 12,
      "signin_days": 5,
      "new_achievements": 1,
      "new_stickers": 2
    },
    "comparison": {
      "last_week_completed": 8,
      "last_week_stars": 10,
      "completed_change": 2,
      "stars_change": 2
    },
    "daily_details": [...],
    "signins": [...],
    "new_achievements": [...],
    "new_stickers": [...],
    "viewed": false
  }
}
```

### PUT /api/report/weekly/:childId/viewed
**标记周报为已读**

---

## 展示设置接口

### GET /api/display/settings/:userId
**获取用户展示设置**

### PUT /api/display/settings
**更新用户展示设置**

```json
{
  "userId": "uuid",
  "equippedAchievementId": "成就UUID",
  "equippedSticker1Id": "贴纸UUID",
  "equippedSticker2Id": "贴纸UUID",
  "theme": "pink",
  "pet": "rabbit",
  "avatarId": "头像UUID"
}
```

---

## 头像接口

### GET /api/avatars
**获取所有头像列表**

```json
[
  { "id": "uuid", "name": "小兔子", "filename": "rabbit.png", "category": "cartoon", "url": "/avatars/rabbit.png" },
  ...
]
```

---

## 备份接口

### GET /api/backup/export/:userId
**导出用户数据**

### GET /api/backup/family/:familyId
**备份整个家庭数据**（家长）

---

## 日志接口

### GET /api/logs
**获取日志列表**（需认证）

```json
// 查询参数: ?limit=50&offset=0
```

---

## 数据字典

### 用户角色 (role)
| 值 | 说明 |
|----|------|
| admin | 家长/管理员 |
| parent | 家长（同admin） |
| child | 孩子 |

### 任务频率 (frequency)
| 值 | 说明 |
|----|------|
| daily | 每日任务 |
| weekly | 每周任务 |
| special | 特殊任务 |
| once | 一次性任务 |

### 贴纸稀有度 (rarity)
| 值 | 说明 |
|----|------|
| N | 普通 |
| R | 稀有 |
| SR | 超稀有 |
| SSR | 传说 |

### 审批状态 (approval_status)
| 值 | 说明 |
|----|------|
| pending | 待审批 |
| approved | 已批准 |
| rejected | 已拒绝 |

### 兑换状态 (status)
| 值 | 说明 |
|----|------|
| pending | 待审批 |
| completed/approved | 已完成/已批准 |
| cancelled/rejected | 已取消/已拒绝 |

### 目标状态 (status)
| 值 | 说明 |
|----|------|
| active | 进行中 |
| completed | 已完成 |
| abandoned | 已放弃 |
