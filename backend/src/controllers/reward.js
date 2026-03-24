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

export async function getRewards(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  try {
    const result = await pool.query(
      'SELECT * FROM rewards WHERE family_id = $1 ORDER BY sort_order, created_at DESC',
      [user.family_id]
    )
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetRewards error:', err)
    ctx.body = error(500, '获取奖励失败')
  }
}

export async function createReward(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { title, icon, starCost, rarity } = ctx.request.body
  
  if (!title) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '奖励名称不能为空')
    return
  }
  
  if (!starCost || starCost <= 0) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '星星消耗必须大于0')
    return
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO rewards (family_id, title, icon, star_cost, rarity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.family_id, title, icon || 'gift-o', starCost, rarity || 'normal']
    )
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('CreateReward error:', err)
    ctx.body = error(500, '创建奖励失败')
  }
}

export async function updateReward(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  const { title, icon, starCost, rarity, isActive, sortOrder } = ctx.request.body
  
  try {
    // 检查奖励是否存在且属于该家庭
    const rewardResult = await pool.query(
      'SELECT * FROM rewards WHERE id = $1 AND family_id = $2',
      [id, user.family_id]
    )
    
    if (rewardResult.rows.length === 0) {
      ctx.body = error(404, '奖励不存在')
      return
    }
    
    const updates = []
    const values = []
    let idx = 1
    
    if (title !== undefined) { updates.push(`title = $${idx++}`); values.push(title) }
    if (icon !== undefined) { updates.push(`icon = $${idx++}`); values.push(icon) }
    if (starCost !== undefined) { updates.push(`star_cost = $${idx++}`); values.push(starCost) }
    if (rarity !== undefined) { updates.push(`rarity = $${idx++}`); values.push(rarity) }
    if (isActive !== undefined) { updates.push(`is_active = $${idx++}`); values.push(isActive) }
    if (sortOrder !== undefined) { updates.push(`sort_order = $${idx++}`); values.push(sortOrder) }
    
    if (updates.length === 0) {
      ctx.body = error(400, '没有要更新的字段')
      return
    }
    
    updates.push('updated_at = NOW()')
    values.push(id, user.family_id)
    
    const result = await pool.query(
      `UPDATE rewards SET ${updates.join(', ')} WHERE id = $${idx++} AND family_id = $${idx} RETURNING *`,
      values
    )
    
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('UpdateReward error:', err)
    ctx.body = error(500, '更新奖励失败')
  }
}

export async function deleteReward(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  
  try {
    // 检查奖励是否存在且属于该家庭
    const rewardResult = await pool.query(
      'SELECT id FROM rewards WHERE id = $1 AND family_id = $2',
      [id, user.family_id]
    )
    
    if (rewardResult.rows.length === 0) {
      ctx.body = error(404, '奖励不存在')
      return
    }
    
    // 软删除：标记为未激活
    await pool.query(
      'UPDATE rewards SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id]
    )
    
    ctx.body = success({ message: '奖励已删除' })
  } catch (err) {
    console.error('DeleteReward error:', err)
    ctx.body = error(500, '删除奖励失败')
  }
}
