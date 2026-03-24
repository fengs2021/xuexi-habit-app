import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'
import { subtractPoints, getPointsInfo, PointType } from '../services/points.js'

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

// 发起兑换（孩子）
export async function createExchange(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  // 只有孩子才能发起兑换
  if (user.role !== 'child') {
    ctx.body = error(ErrorCodes.NO_PERMISSION, '只有孩子才能发起兑换')
    return
  }
  
  try {
    const { rewardId } = ctx.request.body
    
    // 检查奖励是否存在
    const rewardResult = await pool.query(
      'SELECT * FROM rewards WHERE id = $1 AND family_id = $2',
      [rewardId, user.family_id]
    )
    
    if (rewardResult.rows.length === 0) {
      ctx.body = error(404, '奖励不存在')
      return
    }
    
    const reward = rewardResult.rows[0]
    
    // 检查星星是否足够
    const pointsInfo = await getPointsInfo(user.id)
    if (!pointsInfo.success || pointsInfo.balance < reward.star_cost) {
      ctx.body = error(3003, '星星不足')
      return
    }
    
    // 创建兑换记录（待审批）
    const result = await pool.query(
      'INSERT INTO exchange_logs (user_id, reward_id, stars_spent, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [user.id, rewardId, reward.star_cost, 'pending']
    )
    
    ctx.body = success({
      exchangeId: result.rows[0].id,
      status: 'pending',
      rewardTitle: reward.title,
      starsSpent: reward.star_cost
    })
  } catch (err) {
    console.error('CreateExchange error:', err)
    ctx.body = error(500, '兑换失败')
  }
}

// 获取待审批列表（家长）
export async function getPendingExchanges(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role === 'child') {
    ctx.body = error(ErrorCodes.NO_PERMISSION, '无权限')
    return
  }
  
  try {
    const result = await pool.query(
      `SELECT e.*, r.title as reward_title, r.icon as reward_icon, r.rarity,
              u.nickname as child_nickname, u.avatar as child_avatar
       FROM exchange_logs e
       JOIN rewards r ON e.reward_id = r.id
       JOIN users u ON e.user_id = u.id
       WHERE u.family_id = $1 AND e.status = 'pending'
       ORDER BY e.created_at DESC`,
      [user.family_id]
    )
    
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetPendingExchanges error:', err)
    ctx.body = error(500, '获取列表失败')
  }
}

// 批准兑换（家长）
export async function approveExchange(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role === 'child') {
    ctx.body = error(ErrorCodes.NO_PERMISSION, '无权限')
    return
  }
  
  const exchangeId = ctx.params.id
  const { comment } = ctx.request.body || {}
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // 获取兑换记录
    const exchangeResult = await client.query(
      'SELECT e.*, r.title as reward_title FROM exchange_logs e JOIN rewards r ON e.reward_id = r.id WHERE e.id = $1',
      [exchangeId]
    )
    
    if (exchangeResult.rows.length === 0) {
      await client.query('ROLLBACK')
      ctx.body = error(404, '兑换记录不存在')
      return
    }
    
    const exchange = exchangeResult.rows[0]
    
    if (exchange.status !== 'pending') {
      await client.query('ROLLBACK')
      ctx.body = error(400, '该兑换已处理')
      return
    }
    
    // 使用统一积分服务扣除星星
    const pointsResult = await subtractPoints(exchange.user_id, exchange.stars_spent, PointType.EXCHANGE, {
      sourceId: exchange.id,
      description: `兑换「${exchange.reward_title}」消耗 ${exchange.stars_spent} 星星`
    })
    
    if (!pointsResult.success) {
      await client.query('ROLLBACK')
      ctx.body = error(3003, pointsResult.error || '余额不足')
      return
    }
    
    // 更新兑换状态
    await client.query(
      'UPDATE exchange_logs SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3',
      ['completed', user.id, exchangeId]
    )
    
    // 记录审批
    await client.query(
      'INSERT INTO exchange_approvals (exchange_id, approver_id, action, comment) VALUES ($1, $2, $3, $4)',
      [exchangeId, user.id, 'approve', comment || null]
    )
    
    await client.query('COMMIT')
    
    ctx.body = success({ 
      status: 'completed',
      currentBalance: pointsResult.balance
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('ApproveExchange error:', err)
    ctx.body = error(500, '审批失败')
  } finally {
    client.release()
  }
}

// 拒绝兑换（家长）
export async function rejectExchange(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role === 'child') {
    ctx.body = error(ErrorCodes.NO_PERMISSION, '无权限')
    return
  }
  
  const exchangeId = ctx.params.id
  const { comment } = ctx.request.body || {}
  
  try {
    // 检查兑换是否存在
    const exchangeResult = await pool.query(
      'SELECT status FROM exchange_logs WHERE id = $1',
      [exchangeId]
    )
    
    if (exchangeResult.rows.length === 0) {
      ctx.body = error(404, '兑换记录不存在')
      return
    }
    
    if (exchangeResult.rows[0].status !== 'pending') {
      ctx.body = error(400, '该兑换已处理')
      return
    }
    
    // 更新兑换状态
    await pool.query(
      'UPDATE exchange_logs SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3',
      ['cancelled', user.id, exchangeId]
    )
    
    // 记录审批
    await pool.query(
      'INSERT INTO exchange_approvals (exchange_id, approver_id, action, comment) VALUES ($1, $2, $3, $4)',
      [exchangeId, user.id, 'reject', comment || null]
    )
    
    ctx.body = success({ status: 'cancelled' })
  } catch (err) {
    console.error('RejectExchange error:', err)
    ctx.body = error(500, '拒绝失败')
  }
}

// 获取兑换历史
export async function getExchangeHistory(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  try {
    let query
    let params
    
    if (user.role === 'child') {
      // 孩子只能看自己的
      query = `
        SELECT e.*, r.title as reward_title, r.icon as reward_icon
        FROM exchange_logs e
        JOIN rewards r ON e.reward_id = r.id
        WHERE e.user_id = $1
        ORDER BY e.created_at DESC
        LIMIT 50`
      params = [user.id]
    } else {
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
        params = [user.family_id, childId]
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
        params = [user.family_id]
      }
    }
    
    const result = await pool.query(query, params)
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetExchangeHistory error:', err)
    ctx.body = error(500, '获取历史失败')
  }
}

// 获取所有孩子的兑换记录（家长视图）
export async function getStudentHistory(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role === 'child') {
    ctx.body = error(ErrorCodes.NO_PERMISSION, '无权限')
    return
  }
  
  try {
    const result = await pool.query(
      `SELECT e.*, u.nickname as user_nickname, r.title as reward_title, r.star_cost 
       FROM exchange_logs e 
       JOIN users u ON e.user_id = u.id 
       JOIN rewards r ON e.reward_id = r.id 
       WHERE u.family_id = $1 
       ORDER BY e.created_at DESC 
       LIMIT 50`,
      [user.family_id]
    )
    
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetStudentHistory error:', err)
    ctx.body = error(500, '获取失败')
  }
}
