# 学习app API 文档

## 基础信息

- 基础URL: `/api`
- 认证方式: JWT Bearer Token
- 所有请求需要携带 `Authorization: Bearer <token>` header

---

## 贴纸系统

### 1. 获取贴纸列表

```
GET /api/stickers
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "xxx",
      "name": "小星星",
      "emoji": "⭐",
      "rarity": "N",
      "description": "完成任务的普通奖励"
    }
  ]
}
```

**稀有度说明:**
- `N` - 普通 (Normal)
- `R` - 稀有 (Rare)
- `SR` - 史诗 (Super Rare)
- `SSR` - 传说 (Super Super Rare)

---

### 2. 获取用户贴纸

```
GET /api/stickers/user/:userId
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "xxx",
      "name": "小星星",
      "emoji": "⭐",
      "rarity": "N",
      "description": "完成任务的普通奖励",
      "obtained_at": "2026-03-25T10:00:00Z"
    }
  ]
}
```

---

## 贴纸抽奖系统

### 3. 获取本周限定贴纸

```
GET /api/sticker-lottery/weekly-limited
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "weekIdentifier": "2026-W13",
    "weekStart": "2026-03-23",
    "weekEnd": "2026-03-29",
    "limitedStickers": [
      {
        "id": "xxx",
        "name": "樱花精灵",
        "emoji": "🌸",
        "rarity": "SR",
        "description": "春季限定 - 浪漫樱花"
      }
    ]
  }
}
```

---

### 4. 获取用户抽奖进度

```
GET /api/sticker-lottery/progress/:userId
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "drawCount": 5,
    "guaranteeCount": 20,
    "canGuaranteeExchange": false,
    "guaranteeExchangeUsed": false
  }
}
```

---

### 5. 执行抽奖

```
POST /api/sticker-lottery/draw/:userId
```

**消耗:** 5 积分/次

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "sticker": {
      "id": "xxx",
      "name": "樱花精灵",
      "emoji": "🌸",
      "rarity": "SR",
      "description": "春季限定 - 浪漫樱花"
    },
    "awarded": true,
    "starsSpent": 5,
    "remainingStars": 22,
    "drawCount": 6,
    "canGuaranteeExchange": false
  }
}
```

---

### 6. 保底兑换

```
POST /api/sticker-lottery/guarantee-exchange/:userId
Content-Type: application/json

{
  "stickerId": "xxx"
}
```

**条件:** 抽奖满 20 次后可使用保底

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "sticker": {
      "id": "xxx",
      "name": "宇宙之心",
      "emoji": "💫",
      "rarity": "SSR",
      "description": "掌控宇宙的力量"
    },
    "message": "保底兑换成功！"
  }
}
```

---

### 7. 获取可选兑换列表

```
GET /api/sticker-lottery/exchange-options/:userId
```

**响应示例:** 返回用户未拥有的、本周奖池内贴纸列表

---

## 奖池系统

### 奖池构成

本周奖池 = **限定池** + **通用池**

- **限定池**: 每周刷新，不同周有不同的限定贴纸
- **通用池**: 长期存在，包含所有通用贴纸

### 抽奖概率

| 稀有度 | 概率 |
|--------|------|
| N | 70% |
| R | 20% |
| SR | 8% |
| SSR | 2% |

### 保底机制

- 每抽奖 20 次，可使用一次保底兑换
- 保底可以兑换任意一张本周奖池内的贴纸（无论是否已有）
- 每周一重置抽奖进度

---

## 成就系统

### 8. 获取用户成就

```
GET /api/achievements/user/:userId
```

**响应示例:**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "xxx",
      "name": "初次冒险",
      "description": "完成第一个任务",
      "rarity": "N",
      "reward_stars": 5,
      "achieved_at": "2026-03-25T10:00:00Z"
    }
  ]
}
```

---

### 成就列表

| 类型 | 名称 | 条件 | 奖励 |
|------|------|------|------|
| task_count | 锋芒初现 | 累计10个任务 | 5★ |
| task_count | 任务大师 | 累计50个任务 | 15★ |
| task_count | 千任务霸者 | 累计100个任务 | 50★ |
| task_streak | 习惯初成 | 连续3天 | 5★ |
| task_streak | 习惯铸造师 | 连续7天 | 15★ |
| streak_task | 专注新星 | 单任务连续7天 | 10★ |
| streak_task | 专注大师 | 单任务连续15天 | 25★ |
| streak_task | 专注传奇 | 单任务连续30天 | 50★ |
| streak_task | 永恒守护者 | 单任务连续60天 | 100★ |
| count_task | 重复执行者 | 单任务10次 | 5★ |
| count_task | 资深执行者 | 单任务30次 | 15★ |
| count_task | 任务传奇 | 单任务60次 | 30★ |
| count_task | 神级执行者 | 单任务100次 | 60★ |
| star_total | 星辉学徒 | 累计50星 | 10★ |
| star_total | 星河贵族 | 累计200星 | 35★ |
| level | 五星冒险家 | 等级5 | 25★ |
| level | 十星传奇 | 等级10 | 60★ |
| goal | 目标猎人 | 完成1个目标 | 15★ |
| goal | 目标大师 | 完成3个目标 | 40★ |
| sticker | 集邮小兵 | 10张贴纸 | 3★ |
| sticker | 收藏新星 | 20张贴纸 | 8★ |
| sticker | 收藏大师 | 30张贴纸 | 18★ |
| login_streak | 忠实冒险者 | 连续3天登录 | 5★ |
| login_streak | 永不懈怠 | 连续7天登录 | 15★ |
| speed_task | 闪电侠 | 5分钟内完成 | 10★ |
| speed_task | 疾风侠 | 10分钟内完成 | 8★ |
| perfect_day | 完美一天 | 一天完成所有每日任务 | 15★ |
| perfect_week | 完美周 | 一周7天都任务 | 50★ |
| early_6 | 晨曦勇者 | 6点前任务 | 10★ |
| early_7 | 破晓骑士 | 7点前任务 | 8★ |
| night_21 | 子夜刺客 | 21点后任务 | 8★ |
| night_23 | 午夜使者 | 23点后任务 | 10★ |
| all_frequency | 全能选手 | 三种频率都完成 | 15★ |
| weekend | 周末战士 | 周六+周日都任务 | 15★ |
| sunday | 周日战神 | 连续3个周日 | 20★ |
| day_star | 星星炸弹 | 单日10星 | 15★ |
| day_task | 任务狂人 | 单日5任务 | 20★ |
| first | 初次冒险 | 第一个任务 | 5★ |
| first | 星星初现 | 第一颗星 | 3★ |
| first | 目标启程 | 第一个目标 | 5★ |
| monthly | 月度守护 | 30天登录 | 40★ |
| century | 百日英雄 | 100天登录 | 80★ |
| family | 家庭英雄 | 帮助家人任务 | 10★ |
| family | 家族荣耀 | 家庭100星 | 25★ |
| comeback | 绝地反击 | 中断后7天 | 30★ |
| comeback | 永不言弃 | 中断后30天 | 60★ |
