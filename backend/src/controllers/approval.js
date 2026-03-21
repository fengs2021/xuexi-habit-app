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

export async function getPendingApprovals(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  try {
    const taskResult = await pool.query(
      `SELECT tl.id, tl.user_id, tl.task_id, tl.stars_earned, tl.completed_date, tl.created_at,
              t.title as task_title, t.star_reward,
              u.nickname as user_nickname, 'task' as type
       FROM task_logs tl
       JOIN tasks t ON tl.task_id = t.id
       JOIN users u ON tl.user_id = u.id
       WHERE t.family_id = $1 AND tl.action = 'completed' AND tl.approval_status = 'pending'
       ORDER BY tl.created_at DESC`,
      [user.family_id]
    )
    
    const exchangeResult = await pool.query(
      `SELECT el.id, el.user_id, el.reward_id, el.stars_spent, el.created_at,
              r.title as reward_title,
              u.nickname as user_nickname, 'exchange' as type
       FROM exchange_logs el
       JOIN rewards r ON el.reward_id = r.id
       JOIN users u ON el.user_id = u.id
       WHERE r.family_id = $1 AND el.status = 'pending'
       ORDER BY el.created_at DESC`,
      [user.family_id]
    )
    
    ctx.body = success({
      tasks: taskResult.rows,
      exchanges: exchangeResult.rows,
      total: taskResult.rows.length + exchangeResult.rows.length
    })
  } catch (err) {
    console.error('GetPendingApprovals error:', err)
    ctx.body = error(500, '获取审批列表失败')
  }
}

export async function getApprovalHistory(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  try {
    const taskResult = await pool.query(
      `SELECT tl.id, tl.user_id, tl.task_id, tl.stars_earned, tl.approval_status, tl.completed_date, tl.created_at,
              t.title as task_title,
              u.nickname as user_nickname, 'task' as type
       FROM task_logs tl
       JOIN tasks t ON tl.task_id = t.id
       JOIN users u ON tl.user_id = u.id
       WHERE t.family_id = $1 AND tl.action = 'completed' AND tl.approval_status != 'pending'
       ORDER BY tl.created_at DESC LIMIT 50`,
      [user.family_id]
    )
    
    const exchangeResult = await pool.query(
      `SELECT el.id, el.user_id, el.reward_id, el.stars_spent, el.status, el.created_at, el.approved_at,
              r.title as reward_title,
              u.nickname as user_nickname, 'exchange' as type
       FROM exchange_logs el
       JOIN rewards r ON el.reward_id = r.id
       JOIN users u ON el.user_id = u.id
       WHERE r.family_id = $1 AND el.status != 'pending'
       ORDER BY el.created_at DESC LIMIT 50`,
      [user.family_id]
    )
    
    ctx.body = success({ tasks: taskResult.rows, exchanges: exchangeResult.rows })
  } catch (err) {
    ctx.body = error(500, '获取历史失败')
  }
}

export async function approveTaskCompletion(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  const { approved } = ctx.request.body || {}
  
  try {
    const logResult = await pool.query(
      `SELECT tl.*, t.star_reward, t.family_id FROM task_logs tl
       JOIN tasks t ON tl.task_id = t.id WHERE tl.id = $1`,
      [id]
    )
    
    if (logResult.rows.length === 0) {
      ctx.body = error(404, '记录不存在')
      return
    }
    
    const log = logResult.rows[0]
    
    if (log.approval_status !== 'pending') {
      ctx.body = error(400, '该记录已审批')
      return
    }
    
    await pool.query('UPDATE task_logs SET approval_status = $1 WHERE id = $2',
      [approved ? 'approved' : 'rejected', id])
    
    if (approved) {
      await pool.query('UPDATE users SET stars = stars + $1 WHERE id = $2',
        [log.star_reward, log.user_id])
    }
    
    ctx.body = success({ approved, starsAdded: approved ? log.star_reward : 0 })
  } catch (err) {
    ctx.body = error(500, '审批失败')
  }
}

export async function approveExchange(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  const { approved } = ctx.request.body || {}
  
  try {
    const exchangeResult = await pool.query(
      `SELECT el.*, r.family_id FROM exchange_logs el
       JOIN rewards r ON el.reward_id = r.id WHERE el.id = $1`,
      [id]
    )
    
    if (exchangeResult.rows.length === 0) {
      ctx.body = error(404, '兑换记录不存在')
      return
    }
    
    const exchange = exchangeResult.rows[0]
    
    if (exchange.status !== 'pending') {
      ctx.body = error(400, '该兑换已审批')
      return
    }
    
    await pool.query('UPDATE exchange_logs SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3',
      [approved ? 'approved' : 'rejected', user.id, id])
    
    if (approved) {
      // 审批通过，扣除学生积分
      await pool.query('UPDATE users SET stars = stars - $1 WHERE id = $2',
        [exchange.stars_spent, exchange.user_id])
    } else {
      // 审批拒绝，返还学生积分
      await pool.query('UPDATE users SET stars = stars + $1 WHERE id = $2',
        [exchange.stars_spent, exchange.user_id])
    }
    
    ctx.body = success({ approved, message: approved ? '已批准' : '已拒绝' })
  } catch (err) {
    ctx.body = error(500, '审批失败')
  }
}

export async function reverseApproval(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  const { type } = ctx.request.body || {}
  
  try {
    if (type === 'task') {
      const logResult = await pool.query('SELECT * FROM task_logs WHERE id = $1', [id])
      if (logResult.rows.length === 0) {
        ctx.body = error(404, '记录不存在')
        return
      }
      const log = logResult.rows[0]
      if (log.approval_status === 'approved') {
        await pool.query('UPDATE users SET stars = stars - $1 WHERE id = $2', [log.stars_earned, log.user_id])
      }
      await pool.query('DELETE FROM task_logs WHERE id = $1', [id])
    } else if (type === 'exchange') {
      const exchangeResult = await pool.query('SELECT * FROM exchange_logs WHERE id = $1', [id])
      if (exchangeResult.rows.length === 0) {
        ctx.body = error(404, '记录不存在')
        return
      }
      const exchange = exchangeResult.rows[0]
      if (exchange.status === 'approved') {
        await pool.query('UPDATE users SET stars = stars + $1 WHERE id = $2', [exchange.stars_spent, exchange.user_id])
      }
      await pool.query('DELETE FROM exchange_logs WHERE id = $1', [id])
    }
    ctx.body = success({ message: '已撤销' })
  } catch (err) {
    ctx.body = error(500, '撤销失败')
  }
}
