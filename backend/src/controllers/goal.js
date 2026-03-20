import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'

export async function getGoals(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    const userResult = await pool.query('SELECT family_id FROM users WHERE id = $1', [decoded.id])
    if (userResult.rows.length === 0) {
      ctx.body = error(ErrorCodes.USER_NOT_FOUND, '用户不存在')
      return
    }
    const result = await pool.query('SELECT * FROM goals WHERE family_id = $1 AND status = $2 ORDER BY created_at DESC', [userResult.rows[0].family_id, 'active'])
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetGoals error:', err)
    ctx.body = error(500, '获取目标失败')
  }
}

export async function createGoal(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    const { title, icon, difficulty, userId } = ctx.request.body
    const userResult = await pool.query('SELECT family_id FROM users WHERE id = $1', [decoded.id])
    if (userResult.rows.length === 0) {
      ctx.body = error(ErrorCodes.USER_NOT_FOUND, '用户不存在')
      return
    }
    const diff = difficulty || 10
    const result = await pool.query(
      'INSERT INTO goals (family_id, user_id, title, icon, difficulty, star_target) VALUES ($1, $2, $3, $4, $5, $5) RETURNING *',
      [userResult.rows[0].family_id, userId || decoded.id, title, icon || 'star', diff]
    )
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('CreateGoal error:', err)
    ctx.body = error(500, '创建目标失败')
  }
}

export async function updateGoal(ctx) {
  ctx.body = error(500, '功能开发中')
}

export async function deleteGoal(ctx) {
  ctx.body = error(500, '功能开发中')
}
