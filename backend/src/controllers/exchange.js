import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'

// 获取兑换记录
export async function getExchanges(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)

    const result = await pool.query(
      'SELECT e.*, r.title as reward_title, r.icon as reward_icon FROM exchange_logs e LEFT JOIN rewards r ON e.reward_id = r.id WHERE e.user_id =  ORDER BY e.created_at DESC LIMIT 50',
      [decoded.id]
    )

    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetExchanges error:', err)
    ctx.body = error(500, '获取兑换记录失败')
  }
}

// 发起兑换
export async function createExchange(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    const { rewardId } = ctx.request.body

    const rewardResult = await pool.query('SELECT * FROM rewards WHERE id = ', [rewardId])

    if (rewardResult.rows.length === 0) {
      ctx.body = error(3004, '奖励不存在')
      return
    }

    const reward = rewardResult.rows[0]

    const userResult = await pool.query('SELECT stars FROM users WHERE id = ', [decoded.id])

    if (userResult.rows[0].stars < reward.star_cost) {
      ctx.body = error(ErrorCodes.STAR_NOT_ENOUGH, '星星不足')
      return
    }

    await pool.query('UPDATE users SET stars = stars -  WHERE id = ', [reward.star_cost, decoded.id])

    const result = await pool.query(
      'INSERT INTO exchange_logs (user_id, reward_id, stars_spent, status) VALUES (, , , \'pending\') RETURNING *',
      [decoded.id, rewardId, reward.star_cost]
    )

    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('CreateExchange error:', err)
    ctx.body = error(500, '兑换失败')
  }
}

export async function updateExchange(ctx) {
  ctx.body = error(500, '功能开发中')
}
