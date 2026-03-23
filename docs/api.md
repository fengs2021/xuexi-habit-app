# API 接口文档

## 基础信息

- 基础 URL: `/api`
- 响应格式: JSON
- 认证方式: Bearer Token (JWT)

## 通用响应格式

```json
// 成功
{
  "code": 0,
  "message": "success",
  "data": {}
}

// 错误
{
  "code": 1001,
  "message": "错误描述",
  "data": null
}
```

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

## 认证接口

### POST /api/auth/login
设备登录

**请求参数**
```json
{
  "deviceId": "设备唯一标识"
}
```

**响应**
```json
{
  "code": 0,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "nickname": "瑶瑶",
      "role": "child"
    }
  }
}
```

### POST /api/auth/register
注册新用户

**请求参数**
```json
{
  "nickname": "瑶瑶",
  "role": "child",  // parent / child
  "deviceId": "设备标识"
}
```

---

## 家庭接口

### GET /api/family
获取家庭信息

**响应**
```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "name": "蹦蹦跳跳真可爱",
    "code": "ABC123",
    "members": [
      {
        "id": "uuid",
        "nickname": "瑶瑶",
        "role": "child",
        "level": 1,
        "stars": 0
      }
    ]
  }
}
```

### PUT /api/family
更新家庭信息

**请求参数**
```json
{
  "name": "新家庭名"
}
```

### POST /api/family/join
加入家庭

**请求参数**
```json
{
  "code": "邀请码"
}
```

---

## 用户接口

### GET /api/users/:id
获取用户信息

### PUT /api/users/:id
更新用户信息

**请求参数**
```json
{
  "nickname": "新昵称",
  "avatar": "头像URL"
}
```

### GET /api/users/:id/stats
获取用户统计

**响应**
```json
{
  "code": 0,
  "data": {
    "totalStars": 50,
    "level": 3,
    "tasksCompleted": 25,
    "goalsAchieved": 2,
    "exchangesCount": 1
  }
}
```

### GET /api/leaderboard
获取排行榜

**查询参数**: `type` - wish | level | streak | exchange

---

## 目标接口

### GET /api/goals
获取目标列表

**查询参数**
- `userId`: 用户 ID（可选）

**响应**
```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "title": "坚持阅读",
      "icon": "book",
      "difficulty": 10,
      "starTarget": 10,
      "currentStars": 3,
      "status": "active"
    }
  ]
}
```

### POST /api/goals
创建目标

**请求参数**
```json
{
  "title": "坚持阅读",
  "icon": "book",
  "difficulty": 10,
  "userId": "用户UUID"  // 可选，null 表示通用目标
}
```

### PUT /api/goals/:id
更新目标

### DELETE /api/goals/:id
删除目标

---

## 任务接口

### GET /api/tasks
获取任务列表

**查询参数**
- `goalId`: 目标 ID（可选）
- `type`: challenge | reward

**响应**
```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "title": "按时起床",
      "icon": "alarm",
      "starReward": 2,
      "rarity": "SR",
      "frequency": "daily",
      "frequencyCount": 1
    }
  ]
}
```

### POST /api/tasks
创建任务

**请求参数**
```json
{
  "title": "按时起床",
  "icon": "alarm",
  "starReward": 2,
  "rarity": "SR",
  "frequency": "daily",
  "frequencyCount": 1,
  "goalId": "目标UUID"  // 可选
}
```

### POST /api/tasks/:id/complete
完成任务

**响应**
```json
{
  "code": 0,
  "data": {
    "starsEarned": 2,
    "totalStars": 5,
    "goalProgress": {
      "current": 5,
      "target": 10
    }
  }
}
```

### POST /api/tasks/:id/skip
跳过任务

---

## 奖励接口

### GET /api/rewards
获取奖励列表

**响应**
```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "title": "玩手机20分钟",
      "icon": "phone",
      "starCost": 30,
      "rarity": "epic"
    }
  ]
}
```

### POST /api/rewards
创建奖励

### PUT /api/rewards/:id
更新奖励

### DELETE /api/rewards/:id
删除奖励

---

## 兑换接口

### GET /api/exchanges
获取兑换记录

### POST /api/exchanges
发起兑换

**请求参数**
```json
{
  "rewardId": "奖励UUID"
}
```

### PUT /api/exchanges/:id
更新兑换状态

**请求参数**
```json
{
  "status": "completed"  // pending / completed / cancelled
}
```

---

## 成就接口

### GET /api/achievements
获取成就列表

**响应**
```json
{
  "code": 0,
  "data": {
    "stats": {
      "goalsAchieved": 0,
      "totalStars": 0,
      "tasksCompleted": 0,
      "level": 1
    },
    "achievements": [
      {
        "id": "uuid",
        "type": "task_count",
        "title": "任务达人",
        "count": 10,
        "unlockedAt": null
      }
    ],
    "leaderboard": {
      "wish": [...],
      "level": [...],
      "streak": [...],
      "exchange": [...]
    }
  }
}
```

---

## 日志接口

### GET /api/logs
获取日志列表

**查询参数**
- `type`: task | exchange（可选）
- `limit`: 数量（默认 20）
- `offset`: 偏移（默认 0）

---

## 统计接口

### GET /api/statistics/daily-stars/:childId
获取近30日每日积分统计

**响应**


### GET /api/statistics/daily-tasks/:childId
获取每日任务完成详情（分页）

**查询参数**
- : 偏移量（默认 0）
- : 每页数量（默认 7）

**响应**


### GET /api/statistics/new-rewards/:childId
获取24小时内新获得的成就和贴纸（用于弹窗提醒）

**响应**


---

## 贴纸接口

### GET /api/stickers
获取所有贴纸列表

### GET /api/stickers/user/:userId
获取用户拥有的贴纸

### GET /api/stickers/user/:userId/ids
获取用户拥有的贴纸ID列表

---

## 展示设置接口

### GET /api/display/:userId
获取用户展示设置

### PUT /api/display/:userId
更新用户展示设置

**请求参数**


---

## 签到接口

### GET /api/signin/:userId
获取用户签到状态

### POST /api/signin/:userId
签到

**响应**



---

## 统计接口

### GET /api/statistics/daily-stars/:childId
获取近30日每日积分统计

**响应**
```json
{
  "code": 0,
  "data": [
    {
      "date": "3月21日",
      "stars": 10
    }
  ]
}
```

### GET /api/statistics/daily-tasks/:childId
获取每日任务完成详情（分页）

**查询参数**
- `offset`: 偏移量（默认 0）
- `limit`: 每页数量（默认 7）

**响应**
```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "completed_date": "2026-03-21",
        "title": "按时起床",
        "icon": "todo-o",
        "stars_earned": 5,
        "action": "completed",
        "star_reward": 2
      }
    ],
    "totalDays": 30,
    "hasMore": true
  }
}
```

### GET /api/statistics/new-rewards/:childId
获取24小时内新获得的成就和贴纸（用于弹窗提醒）

**响应**
```json
{
  "code": 0,
  "data": {
    "achievements": [
      {
        "id": "uuid",
        "name": "小试牛刀",
        "description": "累计完成10个任务",
        "reward_stars": 5,
        "unlocked_at": "2026-03-20T11:26:40.946Z"
      }
    ],
    "stickers": [
      {
        "id": "uuid",
        "emoji": "⭐",
        "name": "小星星",
        "rarity": "N",
        "earned_at": "2026-03-20T11:26:40.946Z"
      }
    ]
  }
}
```

---

## 贴纸接口

### GET /api/stickers
获取所有贴纸列表

### GET /api/stickers/user/:userId
获取用户拥有的贴纸

### GET /api/stickers/user/:userId/ids
获取用户拥有的贴纸ID列表

---

## 展示设置接口

### GET /api/display/:userId
获取用户展示设置

### PUT /api/display/:userId
更新用户展示设置

**请求参数**
```json
{
  "equipped_achievement_id": "成就UUID",
  "equipped_sticker1_id": "贴纸UUID",
  "equipped_sticker2_id": "贴纸UUID"
}
```

---

## 签到接口

### GET /api/signin/:userId
获取用户签到状态

### POST /api/signin/:userId
签到

**响应**
```json
{
  "code": 0,
  "data": {
    "signed": true,
    "streak": 3,
    "reward": 2
  }
}
```

---

## 转盘接口

### GET /api/wheel/config
获取转盘配置和奖品列表

### POST /api/wheel/spin/:userId
用户转动转盘

**响应**
```json
{
  "code": 0,
  "data": {
    "prize": {
      "id": "uuid",
      "name": "2星",
      "prize_type": "stars",
      "prize_value": 2
    },
    "remainingSpins": 0
  }
}
```

---

## 每周报告接口

### GET /api/report/weekly/:childId
获取指定孩子的周报

**查询参数**
- `type`: `last` - 获取上周报告（周一弹窗用）

**响应**
```json
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
    "daily_details": [
      {
        "date": "2026-03-16",
        "total": 14,
        "completed": 12,
        "skipped": 1,
        "stars": 12
      }
    ],
    "signins": [
      {
        "sign_date": "2026-03-16",
        "streak_days": 3,
        "bonus_stars": 2
      }
    ],
    "new_achievements": [
      {
        "id": "uuid",
        "name": "小试牛刀",
        "description": "累计完成10个任务",
        "reward_stars": 5
      }
    ],
    "new_stickers": [
      {
        "id": "uuid",
        "emoji": "⭐",
        "name": "小星星",
        "rarity": "N"
      }
    ],
    "viewed": false
  }
}
```

### PUT /api/report/weekly/:childId/viewed
标记周报为已读

---

## 签到接口

### GET /api/signin/info/:userId
获取用户签到信息

**响应**
```json
{
  "code": 0,
  "data": {
    "checkedIn": false,
    "streakDays": 3,
    "todayBonus": 2,
    "canClaim": true,
    "monthDays": [1, 2, 3, 5, 6, 7, 8]
  }
}
```

### POST /api/signin/checkin
执行签到

**请求参数**
```json
{
  "userId": "uuid"
}
```

**响应**
```json
{
  "code": 0,
  "data": {
    "streakDays": 4,
    "bonusStars": 2,
    "totalStars": 15
  }
}
```

---

## 成就接口

### GET /api/achievements
获取所有成就定义

### GET /api/achievements/user/:userId
获取用户已解锁的成就
