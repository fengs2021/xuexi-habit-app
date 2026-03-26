import Router from '@koa/router'
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'

const router = new Router({ prefix: '/api/points' })

// 获取孩子的积分明细（家长调用）
router.get('/child-logs/:childId', async (ctx) => {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(1002, '未登录')
    return
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    jwt.verify(token, JWT_SECRET)
  } catch (err) {
    ctx.body = error(1002, '登录已过期')
    return
  }

  const { childId } = ctx.params
  const { limit = 50, offset = 0 } = ctx.query

  try {
    const result = await pool.query(`
      SELECT 
        pl.id,
        pl.amount,
        pl.balance_after,
        pl.type,
        pl.source,
        pl.description,
        pl.created_at,
        u.nickname as user_nickname
      FROM point_logs pl
      JOIN users u ON pl.user_id = u.id
      WHERE pl.user_id = $1
      ORDER BY pl.created_at DESC
      LIMIT $2 OFFSET $3
    `, [childId, limit, offset])

    // 获取总数
    const countResult = await pool.query('SELECT COUNT(*) FROM point_logs WHERE user_id = $1', [childId])
    const total = parseInt(countResult.rows[0].count)

    ctx.body = success({
      items: result.rows,
      total,
      hasMore: parseInt(offset) + result.rows.length < total
    })
  } catch (err) {
    console.error('Get child point logs error:', err)
    ctx.body = error(500, '获取积分明细失败')
  }
})

// 获取孩子的积分汇总
router.get('/child-summary/:childId', async (ctx) => {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(1002, '未登录')
    return
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    jwt.verify(token, JWT_SECRET)
  } catch (err) {
    ctx.body = error(1002, '登录已过期')
    return
  }

  const { childId } = ctx.params

  try {
    // 从 point_logs 实时计算余额（比 users 表更准确）
    const balanceResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as balance 
      FROM point_logs WHERE user_id = $1
    `, [childId])
    const calculatedBalance = parseInt(balanceResult.rows[0].balance)

    // 从积分明细计算获得和消费总额
    const statsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_spent
      FROM point_logs
      WHERE user_id = $1
    `, [childId])

    const stats = statsResult.rows[0]

    ctx.body = success({
      currentBalance: calculatedBalance,
      totalEarned: parseInt(stats.total_earned),
      totalSpent: parseInt(stats.total_spent),
      // 从 point_logs 按类型汇总
      byType: (await pool.query(`
        SELECT 
          type,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as earned,
          SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as spent,
          COUNT(*) as count
        FROM point_logs
        WHERE user_id = $1
        GROUP BY type
        ORDER BY count DESC
      `, [childId])).rows
    })
  } catch (err) {
    console.error('Get child point summary error:', err)
    ctx.body = error(500, '获取积分汇总失败')
  }
})

export default router
