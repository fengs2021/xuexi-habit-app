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

  const { rewardId } = ctx.request.body
  
  try {
    // 查找奖励
    const rewardResult = await pool.query(
      'SELECT * FROM rewards WHERE id = $1 AND is_active = true',
      [rewardId]
    )
    if (rewardResult.rows.length === 0) {
      ctx.body = error(404, '奖励不存在')
      return
    }
    
    const reward = rewardResult.rows[0]
    
    // 获取用户当前积分
    const pointsInfo = await getPointsInfo(user.id)
    const currentStars = pointsInfo.currentBalance || 0
    
    if (currentStars < reward.star_cost) {
      ctx.body = error(400, '积分不足')
      return
    }
    
    // 扣除积分
    const deductResult = await subtractPoints(user.id, reward.star_cost, PointType.EXCHANGE, {
      sourceId: rewardId,
      description: `兑换奖励：${reward.title}`
    })
    
    if (!deductResult.success) {
      ctx.body = error(400, deductResult.error || '积分扣除失败')
      return
    }
    
    // 创建兑换记录（待审批）
    const exchangeResult = await pool.query(
      'INSERT INTO exchange_logs (user_id, reward_id, stars_spent, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [user.id, rewardId, reward.star_cost, 'pending']
    )
    
    ctx.body = success(exchangeResult.rows[0])
  } catch (err) {
    console.error('CreateExchange error:', err)
    ctx.body = error(500, '兑换失败')
  }
}

// 获取孩子的兑换历史（家长审批后孩子可查看）
export async function getStudentHistory(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  try {
    const result = await pool.query(
      `SELECT el.*, r.title as reward_title, r.icon as reward_icon,
              u.nickname as approved_by_nickname
       FROM exchange_logs el
       JOIN rewards r ON el.reward_id = r.id
       LEFT JOIN users u ON el.approved_by = u.id
       WHERE el.user_id = $1
       ORDER BY el.created_at DESC
       LIMIT 50`,
      [user.id]
    )
    
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetStudentHistory error:', err)
    ctx.body = error(500, '获取历史失败')
  }
}
