import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'

async function getUserFromToken(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return null
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    const userResult = await pool.query(
      'SELECT u.*, f.name as family_name FROM users u LEFT JOIN family f ON u.family_id = f.id WHERE u.id = $1',
      [decoded.id]
    )
    if (userResult.rows.length === 0) {
      ctx.body = error(404, '用户不存在')
      return null
    }
    return userResult.rows[0]
  } catch (err) {
    ctx.body = error(401, '无效的token')
    return null
  }
}

export async function getGoals(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  try {
    const result = await pool.query(
      'SELECT * FROM goals WHERE family_id = $1 ORDER BY created_at DESC',
      [user.family_id]
    )
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetGoals error:', err)
    ctx.body = error(500, '获取目标失败')
  }
}

export async function createGoal(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { title, icon, difficulty, userId } = ctx.request.body
  
  if (!title) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '目标名称不能为空')
    return
  }
  
  try {
    const diff = difficulty || 10
    const result = await pool.query(
      'INSERT INTO goals (family_id, user_id, title, icon, difficulty, star_target) VALUES ($1, $2, $3, $4, $5, $5) RETURNING *',
      [user.family_id, userId || user.id, title, icon || 'star', diff]
    )
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('CreateGoal error:', err)
    ctx.body = error(500, '创建目标失败')
  }
}

export async function updateGoal(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  const { title, icon, difficulty, starTarget, status, currentStars } = ctx.request.body
  
  try {
    // 检查目标是否存在且属于该家庭
    const goalResult = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND family_id = $2',
      [id, user.family_id]
    )
    
    if (goalResult.rows.length === 0) {
      ctx.body = error(404, '目标不存在')
      return
    }
    
    const updates = []
    const values = []
    let idx = 1
    
    if (title !== undefined) { updates.push(`title = $${idx++}`); values.push(title) }
    if (icon !== undefined) { updates.push(`icon = $${idx++}`); values.push(icon) }
    if (difficulty !== undefined) { updates.push(`difficulty = $${idx++}`); values.push(difficulty) }
    if (starTarget !== undefined) { updates.push(`star_target = $${idx++}`); values.push(starTarget) }
    if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status) }
    if (currentStars !== undefined) { updates.push(`current_stars = $${idx++}`); values.push(currentStars) }
    
    if (updates.length === 0) {
      ctx.body = error(400, '没有要更新的字段')
      return
    }
    
    updates.push('updated_at = NOW()')
    values.push(id, user.family_id)
    
    const result = await pool.query(
      `UPDATE goals SET ${updates.join(', ')} WHERE id = $${idx++} AND family_id = $${idx} RETURNING *`,
      values
    )
    
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('UpdateGoal error:', err)
    ctx.body = error(500, '更新目标失败')
  }
}

export async function deleteGoal(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  
  try {
    // 检查目标是否存在且属于该家庭
    const goalResult = await pool.query(
      'SELECT id FROM goals WHERE id = $1 AND family_id = $2',
      [id, user.family_id]
    )
    
    if (goalResult.rows.length === 0) {
      ctx.body = error(404, '目标不存在')
      return
    }
    
    // 软删除：标记为 abandoned
    await pool.query(
      'UPDATE goals SET status = $1, updated_at = NOW() WHERE id = $2',
      ['abandoned', id]
    )
    
    ctx.body = success({ message: '目标已删除' })
  } catch (err) {
    console.error('DeleteGoal error:', err)
    ctx.body = error(500, '删除目标失败')
  }
}
