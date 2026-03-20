import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'

// 角色检查中间件
function requireRole(...roles) {
  return async (ctx, next) => {
    const authHeader = ctx.headers.authorization
    if (!authHeader) {
      ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
      return
    }
    try {
      const token = authHeader.replace('Bearer ', '')
      const decoded = jwt.verify(token, JWT_SECRET)
      if (!roles.includes(decoded.role)) {
        ctx.body = error(ErrorCodes.NO_PERMISSION, '无权限')
        return
      }
      ctx.state.user = decoded
      await next()
    } catch (err) {
      ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    }
  }
}

// 发起兑换（孩子）
export async function createExchange(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // 孩子才能发起兑换
    if (decoded.role === 'child') {
      const { rewardId } = ctx.request.body
      
      const rewardResult = await pool.query('SELECT * FROM rewards WHERE id = $1', [rewardId])
      if (rewardResult.rows.length === 0) {
        ctx.body = error(3004, '奖励不存在')
        return
      }
      
      const reward = rewardResult.rows[0]
      
      // 检查星星是否足够（只是检查，不扣减）
      const userResult = await pool.query('SELECT stars FROM users WHERE id = $1', [decoded.id])
      if (userResult.rows[0].stars < reward.star_cost) {
        ctx.body = error(3003, '星星不足')
        return
      }
      
      // 创建兑换记录（待审批）
      const result = await pool.query(
        'INSERT INTO exchange_logs (user_id, reward_id, stars_spent, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [decoded.id, rewardId, reward.star_cost, 'pending']
      )
      
      ctx.body = success({
        exchangeId: result.rows[0].id,
        status: 'pending',
        rewardTitle: reward.title,
        starsSpent: reward.star_cost
      })
    } else {
      ctx.body = error(1003, '家长角色不能发起兑换')
    }
  } catch (err) {
    console.error('CreateExchange error:', err)
    ctx.body = error(500, '兑换失败')
  }
}

// 获取待审批列表（家长）
export async function getPendingExchanges(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // 只有 admin 和 parent 可以审批
    if (!['admin', 'parent'].includes(decoded.role)) {
      ctx.body = error(ErrorCodes.NO_PERMISSION, '无权限')
      return
    }
    
    // 获取家庭内的待审批兑换
    const result = await pool.query(
      `SELECT e.*, r.title as reward_title, r.icon as reward_icon, r.rarity,
              u.nickname as child_nickname, u.avatar as child_avatar
       FROM exchange_logs e
       JOIN rewards r ON e.reward_id = r.id
       JOIN users u ON e.user_id = u.id
       WHERE u.family_id = $1 AND e.status = 'pending'
       ORDER BY e.created_at DESC`,
      [decoded.familyId]
    )
    
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetPendingExchanges error:', err)
    ctx.body = error(500, '获取列表失败')
  }
}

// 批准兑换（家长）
export async function approveExchange(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    
    if (!['admin', 'parent'].includes(decoded.role)) {
      ctx.body = error(ErrorCodes.NO_PERMISSION, '无权限')
      return
    }
    
    const exchangeId = ctx.params.id
    const { comment } = ctx.request.body || {}
    
    // 获取兑换记录
    const exchangeResult = await pool.query(
      'SELECT e.*, r.title as reward_title FROM exchange_logs e JOIN rewards r ON e.reward_id = r.id WHERE e.id = $1',
      [exchangeId]
    )
    
    if (exchangeResult.rows.length === 0) {
      ctx.body = error(3004, '兑换记录不存在')
      return
    }
    
    const exchange = exchangeResult.rows[0]
    
    if (exchange.status !== 'pending') {
      ctx.body = error(3006, '该兑换已处理')
      return
    }
    
    // 扣除星星
    await pool.query(
      'UPDATE users SET stars = stars - $1 WHERE id = $2',
      [exchange.stars_spent, exchange.user_id]
    )
    
    // 更新兑换状态
    await pool.query(
      'UPDATE exchange_logs SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3',
      ['completed', decoded.id, exchangeId]
    )
    
    // 记录审批
    await pool.query(
      'INSERT INTO exchange_approvals (exchange_id, approver_id, action, comment) VALUES ($1, $2, $3, $4)',
      [exchangeId, decoded.id, 'approve', comment || null]
    )
    
    ctx.body = success({ status: 'completed' })
  } catch (err) {
    console.error('ApproveExchange error:', err)
    ctx.body = error(500, '审批失败')
  }
}

// 拒绝兑换（家长）
export async function rejectExchange(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    
    if (!['admin', 'parent'].includes(decoded.role)) {
      ctx.body = error(ErrorCodes.NO_PERMISSION, '无权限')
      return
    }
    
    const exchangeId = ctx.params.id
    const { comment } = ctx.request.body || {}
    
    // 更新兑换状态
    await pool.query(
      'UPDATE exchange_logs SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3',
      ['cancelled', decoded.id, exchangeId]
    )
    
    // 记录审批
    await pool.query(
      'INSERT INTO exchange_approvals (exchange_id, approver_id, action, comment) VALUES ($1, $2, $3, $4)',
      [exchangeId, decoded.id, 'reject', comment || null]
    )
    
    ctx.body = success({ status: 'cancelled' })
  } catch (err) {
    console.error('RejectExchange error:', err)
    ctx.body = error(500, '拒绝失败')
  }
}

// 获取兑换历史
export async function getExchangeHistory(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    
    let query
    let params
    
    if (['admin', 'parent'].includes(decoded.role)) {
      // 家长可以看所有家庭成员的兑换
      const childId = ctx.query.childId
      if (childId) {
        query = `
          SELECT e.*, r.title as reward_title, r.icon as reward_icon,
                 u.nickname as child_nickname
          FROM exchange_logs e
          JOIN rewards r ON e.reward_id = r.id
          JOIN users u ON e.user_id = u.id
          WHERE u.family_id = $1 AND e.user_id = $2
          ORDER BY e.created_at DESC
          LIMIT 50`
        params = [decoded.familyId, childId]
      } else {
        query = `
          SELECT e.*, r.title as reward_title, r.icon as reward_icon,
                 u.nickname as child_nickname
          FROM exchange_logs e
          JOIN rewards r ON e.reward_id = r.id
          JOIN users u ON e.user_id = u.id
          WHERE u.family_id = $1
          ORDER BY e.created_at DESC
          LIMIT 50`
        params = [decoded.familyId]
      }
    } else {
      // 孩子只能看自己的
      query = `
        SELECT e.*, r.title as reward_title, r.icon as reward_icon
        FROM exchange_logs e
        JOIN rewards r ON e.reward_id = r.id
        WHERE e.user_id = $1
        ORDER BY e.created_at DESC
        LIMIT 50`
      params = [decoded.id]
    }
    
    const result = await pool.query(query, params)
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetExchangeHistory error:', err)
    ctx.body = error(500, '获取历史失败')
  }
}
