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
