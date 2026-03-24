import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'
import { addPoints, subtractPoints, PointType } from '../services/points.js'

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
       WHERE t.family_id = $1 AND tl.action = 'complete' AND tl.approval_status = 'pending'
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
      exchanges: exchangeResult.rows
    })
  } catch (err) {
    console.error('GetPendingApprovals error:', err)
    ctx.body = error(500, '获取待审批列表失败')
  }
}

export async function getApprovalHistory(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  try {
    const taskResult = await pool.query(
      `SELECT tl.id, tl.user_id, tl.task_id, tl.stars_earned, tl.approval_status, tl.created_at,
              t.title as task_title,
              u.nickname as user_nickname, 'task' as type
       FROM task_logs tl
       JOIN tasks t ON tl.task_id = t.id
       JOIN users u ON tl.user_id = u.id
       WHERE t.family_id = $1 AND tl.approval_status != 'pending'
       ORDER BY tl.created_at DESC
       LIMIT 50`,
      [user.family_id]
    )
    
    const exchangeResult = await pool.query(
      `SELECT el.id, el.user_id, el.reward_id, el.stars_spent, el.status, el.created_at,
              r.title as reward_title,
              u.nickname as user_nickname, 'exchange' as type
       FROM exchange_logs el
       JOIN rewards r ON el.reward_id = r.id
       JOIN users u ON el.user_id = u.id
       WHERE r.family_id = $1 AND el.status != 'pending'
       ORDER BY el.created_at DESC
       LIMIT 50`,
      [user.family_id]
    )
    
    ctx.body = success({
      tasks: taskResult.rows,
      exchanges: exchangeResult.rows
    })
  } catch (err) {
    console.error('GetApprovalHistory error:', err)
    ctx.body = error(500, '获取审批历史失败')
  }
}

export async function approveTaskCompletion(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  const { approved } = ctx.request.body || {}
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    const logResult = await client.query(
      `SELECT tl.*, t.star_reward, t.family_id, t.frequency as task_frequency, t.title as task_title
       FROM task_logs tl
       JOIN tasks t ON tl.task_id = t.id WHERE tl.id = $1`,
      [id]
    )
    
    if (logResult.rows.length === 0) {
      await client.query('ROLLBACK')
      ctx.body = error(404, '记录不存在')
      return
    }
    
    const log = logResult.rows[0]
    
    if (log.approval_status !== 'pending') {
      await client.query('ROLLBACK')
      ctx.body = error(400, '该记录已审批')
      return
    }
    
    await client.query('UPDATE task_logs SET approval_status = $1 WHERE id = $2',
      [approved ? 'approved' : 'rejected', id])
    
    let pointsResult = { success: true, balance: 0 }
    let stickerResult = null
    let newAchievements = []
    
    if (approved) {
      const starsEarned = log.star_reward || 1
      
      // 使用统一积分服务增加星星
      pointsResult = await addPoints(log.user_id, starsEarned, PointType.TASK_APPROVE, {
        sourceId: log.id,
        description: `完成任务「${log.task_title}」获得 ${starsEarned} 星星`
      })
      
      // 发放贴纸
      try {
        const rewardsModule = await import('./rewards.js')
        const { awardRandomSticker, checkAndAwardAchievements } = rewardsModule
        stickerResult = await awardRandomSticker(log.user_id, log.task_frequency || 'daily')
        newAchievements = await checkAndAwardAchievements(log.user_id)
      } catch (e) {
        console.error('Award sticker/achievement error:', e)
      }
    }
    
    await client.query('COMMIT')
    ctx.body = success({ 
      approved, 
      starsAdded: approved ? (log.star_reward || 1) : 0,
      currentBalance: pointsResult.balance,
      sticker: stickerResult,
      newAchievements: newAchievements
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('ApproveTaskLog error:', err)
    ctx.body = error(500, '审批失败')
  } finally {
    client.release()
  }
}

export async function approveExchange(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  const { approved } = ctx.request.body || {}
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    const exchangeResult = await client.query(
      `SELECT el.*, r.title as reward_title, r.family_id
       FROM exchange_logs el
       JOIN rewards r ON el.reward_id = r.id
       WHERE el.id = $1`,
      [id]
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
    
    // 更新兑换状态
    await client.query('UPDATE exchange_logs SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3',
      [approved ? 'approved' : 'rejected', user.id, id])
    
    // 记录审批
    await client.query(
      'INSERT INTO exchange_approvals (exchange_id, approver_id, action) VALUES ($1, $2, $3)',
      [id, user.id, approved ? 'approve' : 'reject']
    )
    
    let pointsResult = { success: true }
    
    if (approved) {
      // 扣除用户星星
      pointsResult = await subtractPoints(exchange.user_id, exchange.stars_spent, PointType.EXCHANGE, {
        sourceId: exchange.id,
        description: `兑换「${exchange.reward_title}」消耗 ${exchange.stars_spent} 星星`
      })
      
      if (!pointsResult.success) {
        await client.query('ROLLBACK')
        ctx.body = error(3003, pointsResult.error || '余额不足')
        return
      }
    }
    
    await client.query('COMMIT')
    ctx.body = success({ 
      approved,
      starsSpent: approved ? exchange.stars_spent : 0,
      currentBalance: pointsResult.balance || 0
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('ApproveExchange error:', err)
    ctx.body = error(500, '审批失败')
  } finally {
    client.release()
  }
}

export async function reverseApproval(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  const { type } = ctx.request.body || {}
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    if (type === 'task') {
      // 撤销任务审批
      const logResult = await client.query(
        `SELECT tl.*, t.title as task_title 
         FROM task_logs tl 
         JOIN tasks t ON tl.task_id = t.id 
         WHERE tl.id = $1`,
        [id]
      )
      
      if (logResult.rows.length === 0) {
        await client.query('ROLLBACK')
        ctx.body = error(404, '记录不存在')
        return
      }
      
      const log = logResult.rows[0]
      
      if (log.approval_status !== 'approved') {
        await client.query('ROLLBACK')
        ctx.body = error(400, '只能撤销已批准的任务')
        return
      }
      
      // 返还星星
      if (log.stars_earned > 0) {
        await addPoints(log.user_id, log.stars_earned, PointType.REVERSE, {
          sourceId: log.id,
          description: `撤销任务「${log.task_title}」，返还 ${log.stars_earned} 星星`
        })
      }
      
      // 标记为已撤销（改回 pending 或删除）
      await client.query(
        "UPDATE task_logs SET approval_status = 'rejected' WHERE id = $1",
        [id]
      )
      
    } else if (type === 'exchange') {
      // 撤销兑换审批
      const exchangeResult = await client.query('SELECT * FROM exchange_logs WHERE id = $1', [id])
      
      if (exchangeResult.rows.length === 0) {
        await client.query('ROLLBACK')
        ctx.body = error(404, '兑换记录不存在')
        return
      }
      
      const exchange = exchangeResult.rows[0]
      
      if (exchange.status !== 'approved') {
        await client.query('ROLLBACK')
        ctx.body = error(400, '只能撤销已完成的兑换')
        return
      }
      
      // 返还星星
      await addPoints(exchange.user_id, exchange.stars_spent, PointType.REVERSE, {
        sourceId: exchange.id,
        description: `撤销兑换，返还 ${exchange.stars_spent} 星星`
      })
      
      // 标记为已撤销
      await client.query(
        "UPDATE exchange_logs SET status = 'cancelled' WHERE id = $1",
        [id]
      )
    }
    
    await client.query('COMMIT')
    ctx.body = success({ message: '撤销成功' })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('ReverseApproval error:', err)
    ctx.body = error(500, '撤销失败')
  } finally {
    client.release()
  }
}
