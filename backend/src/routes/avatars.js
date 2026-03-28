import Router from '@koa/router'
import crypto from 'crypto'
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import { subtractPoints, addPoints, PointType } from '../services/points.js'

const router = new Router({ prefix: '/api/avatars' })

// 工具函数：安全随机数
function secureRandom(max) {
  const bytes = crypto.randomBytes(4)
  const num = bytes.readUInt32BE(0)
  return (num % max)
}

// 工具函数：获取当前周标识 YYYY-WXX
function getCurrentWeekIdentifier() {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  return `${year}-W${String(weekNumber).padStart(2, '0')}`
}

// 工具函数：获取本周开始日期
function getWeekStartDate() {
  const now = new Date()
  const dayOfWeek = now.getDay() || 7
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - dayOfWeek + 1)
  return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
}

// 工具函数：获取本周结束日期
function getWeekEndDate() {
  const now = new Date()
  const dayOfWeek = now.getDay() || 7
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() - dayOfWeek + 7)
  return `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`
}

// 获取所有头像列表（包含当前用户的锁定状态）
router.get('/', async (ctx) => {
  try {
    const userId = ctx.query.userId

    if (!userId) {
      ctx.body = error(400, 'userId is required')
      return
    }

    // 获取用户已解锁的头像
    const unlockedResult = await pool.query(
      'SELECT avatar_id FROM user_avatars WHERE user_id = $1',
      [userId]
    )
    const unlockedIds = unlockedResult.rows.map(r => r.avatar_id)

    // 获取当前周标识
    const currentWeek = getCurrentWeekIdentifier()

    // 获取所有头像，标记锁定状态
    const result = await pool.query(
      'SELECT id, name, filename, category, pool_type, week_identifier, is_active FROM avatars ORDER BY category, name'
    )

    const avatars = result.rows.map(row => {
      const isUnlocked = unlockedIds.includes(row.id)
      const isLimitedThisWeek = row.pool_type === 'limited' && row.week_identifier === currentWeek
      // 锁定：未解锁的头像都显示为锁定（即使是本周限定，也需要先抽取才能用）
      const locked = !isUnlocked

      return {
        ...row,
        url: `/avatars/${row.filename}`,
        unlocked: isUnlocked,
        locked,
        availableThisWeek: isLimitedThisWeek
      }
    })

    ctx.body = success(avatars)
  } catch (err) {
    console.error('Get avatars error:', err)
    ctx.body = error(500, '获取头像列表失败')
  }
})

// 获取本周限定头像信息
router.get('/weekly-limited', async (ctx) => {
  try {
    const userId = ctx.query.userId
    const currentWeek = getCurrentWeekIdentifier()
    const weekStart = getWeekStartDate()
    const weekEnd = getWeekEndDate()

    const result = await pool.query(
      `SELECT id, name, filename, category, week_identifier
       FROM avatars
       WHERE pool_type = 'limited' AND week_identifier = $1 AND is_active = true`,
      [currentWeek]
    )

    let avatars = result.rows.map(a => ({ ...a, url: `/avatars/${a.filename}` }))

    // 如果传了 userId，标记哪些已获得
    if (userId) {
      const owned = await pool.query(
        'SELECT avatar_id FROM user_avatars WHERE user_id = $1',
        [userId]
      )
      const ownedIds = new Set(owned.rows.map(r => r.avatar_id))
      avatars = avatars.map(a => ({ ...a, owned: ownedIds.has(a.id) }))
    }

    ctx.body = success({
      weekIdentifier: currentWeek,
      weekStart,
      weekEnd,
      limitedAvatars: avatars
    })
  } catch (err) {
    console.error('Get weekly limited avatars error:', err)
    ctx.body = error(500, '获取本周限定失败')
  }
})

// 头像抽奖（从本周限定池抽取，10%概率掉落）
// 每次消耗 10 星星，保底 20 抽
router.post('/gacha/:userId', async (ctx) => {
  const { userId } = ctx.params
  const DRAW_COST = 10
  const GUARANTEE_COUNT = 20

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 原子扣积分（单条UPDATE，检查余额）
    const deductResult = await client.query(
      `UPDATE users SET stars = stars - $1, updated_at = NOW()
       WHERE id = $2 AND stars >= $1
       RETURNING stars`,
      [DRAW_COST, userId]
    )
    if (deductResult.rows.length === 0) {
      await client.query('ROLLBACK')
      ctx.body = error(400, `积分不够，需要${DRAW_COST}积分`)
      return
    }
    const currentStars = deductResult.rows[0].stars

    // 10% 直接掉落（随机给一张未解锁的头像）
    const dropRate = 0.10
    const roll = Math.random()
    let awarded = false
    let awardedAvatar = null

    if (roll < dropRate) {
      // 10% 概率：从所有未解锁的头像中随机抽一张
      const avatarResult = await client.query(
        `SELECT a.* FROM avatars a
         WHERE a.is_active = true
           AND a.id NOT IN (SELECT avatar_id FROM user_avatars WHERE user_id = $1)
         ORDER BY RANDOM()
         LIMIT 1`,
        [userId]
      )
      if (avatarResult.rows.length > 0) {
        awardedAvatar = avatarResult.rows[0]
        await client.query(
          'INSERT INTO user_avatars (user_id, avatar_id, source) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [userId, awardedAvatar.id, 'gacha']
        )
        awarded = true
      }
    }

    // 如果没掉落，从本周限定池抽取
    if (!awarded) {
      const currentWeek = getCurrentWeekIdentifier()

      // 优先从限定池抽（排除已拥有的）
      const limitedResult = await client.query(
        `SELECT a.* FROM avatars a
         WHERE a.pool_type = 'limited' AND a.week_identifier = $1 AND a.is_active = true
           AND a.id NOT IN (SELECT avatar_id FROM user_avatars WHERE user_id = $2)
         ORDER BY RANDOM()
         LIMIT 1`,
        [currentWeek, userId]
      )

      if (limitedResult.rows.length > 0) {
        awardedAvatar = limitedResult.rows[0]
        await client.query(
          'INSERT INTO user_avatars (user_id, avatar_id, source) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [userId, awardedAvatar.id, 'gacha']
        )
        awarded = true
      } else {
        // 限定池抽完了（都拥有了），从 general 池补一张
        const generalResult = await client.query(
          `SELECT a.* FROM avatars a
           WHERE a.pool_type = 'general' AND a.is_active = true
             AND a.id NOT IN (SELECT avatar_id FROM user_avatars WHERE user_id = $1)
           ORDER BY RANDOM()
           LIMIT 1`,
          [userId]
        )
        if (generalResult.rows.length > 0) {
          awardedAvatar = generalResult.rows[0]
          await client.query(
            'INSERT INTO user_avatars (user_id, avatar_id, source) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [userId, awardedAvatar.id, 'gacha']
          )
          awarded = true
        }
      }
    }

    // 记录积分日志（积分已在上面原子扣除了）
    await client.query(
      `INSERT INTO point_logs (user_id, amount, balance_after, type, source, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, -DRAW_COST, currentStars, PointType.LOTTERY, PointType.LOTTERY, `头像抽奖消耗${DRAW_COST}星星`]
    )

    // 更新进度
    await client.query(
      `INSERT INTO avatar_gacha_progress (user_id, draw_count)
       VALUES ($1, 1)
       ON CONFLICT (user_id) DO UPDATE SET draw_count = avatar_gacha_progress.draw_count + 1`,
      [userId]
    )

    await client.query('COMMIT')

    // 查最新进度
    const progressResult = await pool.query(
      'SELECT draw_count FROM avatar_gacha_progress WHERE user_id = $1',
      [userId]
    )
    const drawCount = progressResult.rows[0]?.draw_count || 1

    if (awarded && awardedAvatar) {
      ctx.body = success({
        awarded: true,
        avatar: {
          id: awardedAvatar.id,
          name: awardedAvatar.name,
          filename: awardedAvatar.filename,
          category: awardedAvatar.category,
          url: `/avatars/${awardedAvatar.filename}`
        },
        starsSpent: DRAW_COST,
        remainingStars: currentStars - DRAW_COST,
        drawCount,
        guaranteed: false,
        message: '恭喜抽中头像！'
      })
    } else {
      ctx.body = success({
        awarded: false,
        starsSpent: DRAW_COST,
        remainingStars: currentStars - DRAW_COST,
        drawCount,
        message: '很遗憾，本次未抽中头像'
      })
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Avatar gacha error:', err)
    ctx.body = error(500, '抽奖失败')
  } finally {
    client.release()
  }
})

// 获取保底兑换可选头像列表（所有未获得的头像）
router.get('/exchange-options/:userId', async (ctx) => {
  const { userId } = ctx.params
  try {
    const result = await pool.query(
      `SELECT a.id, a.name, a.filename, a.category, a.pool_type, a.week_identifier
       FROM avatars a
       LEFT JOIN user_avatars ua ON ua.avatar_id = a.id AND ua.user_id = $1
       WHERE ua.avatar_id IS NULL AND a.is_active = true
       ORDER BY a.category, a.name`,
      [userId]
    )
    ctx.body = success(result.rows.map(a => ({
      ...a,
      url: `/avatars/${a.filename}`
    })))
  } catch (err) {
    console.error('Get avatar exchange options error:', err)
    ctx.body = error(500, '获取可选头像失败')
  }
})

// 保底兑换（20次后可用，用积分兑换指定头像）
router.post('/guarantee-exchange/:userId', async (ctx) => {
  const { userId } = ctx.params
  const { avatarId } = ctx.request.body
  const GUARANTEE_COUNT = 20
  const GUARANTEE_COST = 100

  if (!avatarId) {
    ctx.body = error(400, '请选择要兑换的头像')
    return
  }

  try {
    // 检查进度
    const progressResult = await pool.query(
      'SELECT draw_count FROM avatar_gacha_progress WHERE user_id = $1',
      [userId]
    )
    const drawCount = progressResult.rows[0]?.draw_count || 0
    if (drawCount < GUARANTEE_COUNT) {
      ctx.body = error(400, `还需${GUARANTEE_COUNT - drawCount}次才能使用保底`)
      return
    }

    // 检查积分
    const userResult = await pool.query('SELECT stars FROM users WHERE id = $1', [userId])
    if ((userResult.rows[0]?.stars || 0) < GUARANTEE_COST) {
      ctx.body = error(400, `积分不够，需要${GUARANTEE_COST}积分`)
      return
    }

    // 检查头像存在
    const avatarResult = await pool.query('SELECT * FROM avatars WHERE id = $1', [avatarId])
    if (avatarResult.rows.length === 0) {
      ctx.body = error(404, '头像不存在')
      return
    }
    const avatar = avatarResult.rows[0]

    // 扣除积分
    await subtractPoints(userId, GUARANTEE_COST, PointType.LOTTERY, {
      description: `头像保底兑换消耗 ${GUARANTEE_COST} 星星`
    })

    // 发放头像
    await pool.query(
      'INSERT INTO user_avatars (user_id, avatar_id, source) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [userId, avatarId, 'guarantee']
    )

    ctx.body = success({
      avatar: {
        id: avatar.id,
        name: avatar.name,
        filename: avatar.filename,
        category: avatar.category,
        url: `/avatars/${avatar.filename}`
      },
      starsSpent: GUARANTEE_COST,
      message: '保底兑换成功！'
    })
  } catch (err) {
    console.error('Avatar guarantee exchange error:', err)
    ctx.body = error(500, '兑换失败')
  }
})

// 获取头像抽奖进度
router.get('/progress/:userId', async (ctx) => {
  const { userId } = ctx.params
  const GUARANTEE_COUNT = 20

  try {
    const progressResult = await pool.query(
      'SELECT draw_count FROM avatar_gacha_progress WHERE user_id = $1',
      [userId]
    )
    const drawCount = progressResult.rows[0]?.draw_count || 0

    ctx.body = success({
      drawCount,
      guaranteeCount: GUARANTEE_COUNT,
      remainingToGuarantee: Math.max(0, GUARANTEE_COUNT - drawCount),
      canGuaranteeExchange: drawCount >= GUARANTEE_COUNT
    })
  } catch (err) {
    ctx.body = success({ drawCount: 0, guaranteeCount: GUARANTEE_COUNT, remainingToGuarantee: GUARANTEE_COUNT, canGuaranteeExchange: false })
  }
})

// 获取用户已解锁头像列表
router.get('/owned/:userId', async (ctx) => {
  const { userId } = ctx.params

  try {
    const result = await pool.query(
      `SELECT a.id, a.name, a.filename, a.category, ua.earned_at, ua.source
       FROM user_avatars ua
       JOIN avatars a ON a.id = ua.avatar_id
       WHERE ua.user_id = $1
       ORDER BY ua.earned_at DESC`,
      [userId]
    )
    ctx.body = success(result.rows.map(r => ({
      ...r,
      url: `/avatars/${r.filename}`
    })))
  } catch (err) {
    ctx.body = error(500, '获取失败')
  }
})

export default router
