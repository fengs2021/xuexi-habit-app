import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'

// 获取奖励列表
export async function getRewards(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)

    const userResult = await pool.query('SELECT family_id FROM users WHERE id = ', [decoded.id])

    if (userResult.rows.length === 0) {
      ctx.body = error(ErrorCodes.USER_NOT_FOUND, '用户不存在')
      return
    }

    const result = await pool.query(
      'SELECT * FROM rewards WHERE family_id =  AND is_active = true ORDER BY sort_order, created_at DESC',
      [userResult.rows[0].family_id]
    )

    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetRewards error:', err)
    ctx.body = error(500, '获取奖励失败')
  }
}

// 创建奖励
export async function createReward(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    const { title, icon, starCost, rarity } = ctx.request.body

    const userResult = await pool.query('SELECT family_id FROM users WHERE id = ', [decoded.id])

    if (userResult.rows.length === 0) {
      ctx.body = error(ErrorCodes.USER_NOT_FOUND, '用户不存在')
      return
    }

    const result = await pool.query(
      'INSERT INTO rewards (family_id, title, icon, star_cost, rarity) VALUES (, , , , ) RETURNING *',
      [userResult.rows[0].family_id, title, icon || 'gift-o', starCost, rarity || 'normal']
    )

    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('CreateReward error:', err)
    ctx.body = error(500, '创建奖励失败')
  }
}

export async function updateReward(ctx) {
  ctx.body = error(500, '功能开发中')
}

export async function deleteReward(ctx) {
  ctx.body = error(500, '功能开发中')
}
