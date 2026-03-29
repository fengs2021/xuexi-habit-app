import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'

// ========== 北京时间工具函数 ==========
// 获取北京时间 0点的 UTC 时间（用于数据库查询）
// 北京 midnight = UTC 前一天 16:00
function getBeijingMidnightUTC(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = fmt.formatToParts(date);
  const get = type => parseInt(parts.find(p => p.type === type).value);
  let y = get('year'), m = get('month'), d = get('day');
  if (d === 1) {
    const prevMonth = new Date(Date.UTC(y, m - 1, 0));
    return new Date(Date.UTC(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth(), prevMonth.getUTCDate(), 16, 0, 0, 0));
  }
  return new Date(Date.UTC(y, m - 1, d - 1, 16, 0, 0, 0));
}

// 获取北京时间本周 Monday 0点的 UTC 时间
function getBeijingWeekStartUTC(date = new Date()) {
  const midnight = getBeijingMidnightUTC(date);
  const dow = date.getDay();
  const diff = dow === 0 ? 6 : dow - 1;
  return new Date(midnight.getTime() - diff * 24 * 60 * 60 * 1000);
}

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

export async function getTasks(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE family_id = $1 AND is_active = true ORDER BY sort_order, created_at DESC',
      [user.family_id]
    )
    const tasks = result.rows
    const now = new Date()
    const cycleStart = getBeijingMidnightUTC(now)
    const weekStart = getBeijingWeekStartUTC(now)
    
    // 确定要查询的用户ID
    let queryUserId = user.id
    
    // 如果是家长账号(role=admin)，查询该家庭中第一个孩子(child)的完成状态
    if (user.role === 'admin') {
      const childResult = await pool.query(
        "SELECT id FROM users WHERE family_id = $1 AND role = 'child' ORDER BY created_at ASC LIMIT 1",
        [user.family_id]
      )
      if (childResult.rows.length > 0) {
        queryUserId = childResult.rows[0].id
      }
    }
    
    for (const task of tasks) {
      let completedInCycle = false
      let pendingApproval = false
      
      // 特殊任务(once)可以反复完成，不需要检查完成状态
      if (task.frequency === 'once') {
        task.completed = false
        task.pendingApproval = false
        continue
      }
      
      let checkTime = task.frequency === 'daily' ? cycleStart : weekStart
      
      // 使用正确的用户ID查询完成状态
      const logResult = await pool.query(
        'SELECT approval_status FROM task_logs WHERE user_id = $1 AND task_id = $2 AND action = $3 AND created_at >= $4::timestamptz ORDER BY created_at DESC LIMIT 1',
        [queryUserId, task.id, 'complete', checkTime.toISOString()]
      )
      if (logResult.rows.length > 0) {
        const approvalStatus = logResult.rows[0].approval_status
        completedInCycle = approvalStatus === 'approved'
        pendingApproval = approvalStatus === 'pending'
      }
      
      task.completed = completedInCycle
      task.pendingApproval = pendingApproval
    }
    
    ctx.body = success({
      daily: tasks.filter(t => t.frequency === 'daily'),
      weekly: tasks.filter(t => t.frequency === 'weekly'),
      special: tasks.filter(t => t.frequency === 'once')
    })
  } catch (err) {
    console.error('GetTasks error:', err)
    ctx.body = error(500, '获取任务失败')
  }
}

export async function createTask(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '只有家长可以创建任务')
    return
  }
  
  const { title, starReward, frequency } = ctx.request.body
  
  // 输入验证
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '任务名称不能为空')
    return
  }
  if (title.length > 100) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '任务名称不能超过100字符')
    return
  }
  if (starReward !== undefined && (typeof starReward !== 'number' || starReward < 0 || starReward > 999)) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '星星奖励必须在0-999之间')
    return
  }
  if (frequency && !['daily', 'weekly', 'once'].includes(frequency)) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '频率必须是 daily/weekly/once')
    return
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO tasks (family_id, title, star_reward, frequency) VALUES ($1, $2, $3, $4) RETURNING *',
      [user.family_id, title.trim(), starReward || 1, frequency || 'daily']
    )
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('CreateTask error:', err)
    ctx.body = error(500, '创建任务失败')
  }
}

export async function completeTask(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  
  try {
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND family_id = $2',
      [id, user.family_id]
    )
    
    if (taskResult.rows.length === 0) {
      ctx.body = error(404, '任务不存在')
      return
    }
    
    const task = taskResult.rows[0]
    
    // 对于每日/每周任务，检查本周期是否已完成
    if (task.frequency !== 'once') {
      const now = new Date()
      let cycleStart = getBeijingMidnightUTC(now)
      if (task.frequency === 'weekly') {
        cycleStart = getBeijingWeekStartUTC(now)
      }
      
      const existingResult = await pool.query(
        `SELECT id FROM task_logs WHERE user_id = $1 AND task_id = $2 AND action = 'complete' AND created_at >= $3::timestamptz LIMIT 1`,
        [user.id, id, cycleStart.toISOString()]
      )
      
      if (existingResult.rows.length > 0) {
        ctx.body = error(400, '本周期的任务已完成，请勿重复提交')
        return
      }
    }
    
    await pool.query(
      'INSERT INTO task_logs (user_id, task_id, action, stars_earned, approval_status) VALUES ($1, $2, $3, $4, $5)',
      [user.id, id, 'complete', task.star_reward, 'pending']
    )
    
    // 学生点击完成时直接掉落贴纸
    let stickerResult = null
    try {
      const rewardsModule = await import('./rewards.js')
      const { awardRandomSticker } = rewardsModule
      stickerResult = await awardRandomSticker(user.id, task.frequency || 'daily')
    } catch (e) {
      console.error('Sticker drop error:', e)
    }
    
    ctx.body = success({ 
      message: '已完成申请，请等待家长审批',
      sticker: stickerResult
    })
  } catch (err) {
    console.error('CompleteTask error:', err)
    ctx.body = error(500, '完成任务失败')
  }
}

export async function skipTask(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  
  try {
    // 对于每日/每周任务，检查本周期是否已操作
    const taskResult = await pool.query('SELECT frequency FROM tasks WHERE id = $1', [id])
    if (taskResult.rows.length === 0) {
      ctx.body = error(404, '任务不存在')
      return
    }
    
    const frequency = taskResult.rows[0].frequency
    
    if (frequency !== 'once') {
      const now = new Date()
      let cycleStart = getBeijingMidnightUTC(now)
      if (frequency === 'weekly') {
        cycleStart = getBeijingWeekStartUTC(now)
      }
      
      const existingResult = await pool.query(
        `SELECT id FROM task_logs WHERE user_id = $1 AND task_id = $2 AND action IN ('complete', 'skipped') AND created_at >= $3::timestamptz LIMIT 1`,
        [user.id, id, cycleStart.toISOString()]
      )
      
      if (existingResult.rows.length > 0) {
        ctx.body = error(400, '本周期的任务已操作，无法跳过')
        return
      }
    }
    
    await pool.query(
      'INSERT INTO task_logs (user_id, task_id, action, stars_earned, approval_status) VALUES ($1, $2, $3, 0, $4)',
      [user.id, id, 'skipped', 'approved']
    )
    ctx.body = success({ message: '已跳过' })
  } catch (err) {
    ctx.body = error(500, '操作失败')
  }
}

export async function updateTask(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '无权限')
    return
  }
  
  const { id } = ctx.params
  const { title, star_reward, frequency, rarity, icon, is_active } = ctx.request.body
  
  try {
    const updates = []
    const values = []
    let idx = 1
    
    if (title !== undefined) { updates.push(`title = $${idx++}`); values.push(title) }
    if (star_reward !== undefined) { updates.push(`star_reward = $${idx++}`); values.push(star_reward) }
    if (frequency !== undefined) { updates.push(`frequency = $${idx++}`); values.push(frequency) }
    if (rarity !== undefined) { updates.push(`rarity = $${idx++}`); values.push(rarity) }
    if (icon !== undefined) { updates.push(`icon = $${idx++}`); values.push(icon) }
    if (is_active !== undefined) { updates.push(`is_active = $${idx++}`); values.push(is_active) }
    
    if (updates.length === 0) {
      ctx.body = error(400, '没有要更新的字段')
      return
    }
    
    values.push(id, user.family_id)
    await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idx++} AND family_id = $${idx}`,
      values
    )
    ctx.body = success({})
  } catch (err) {
    console.error('UpdateTask error:', err)
    ctx.body = error(500, '更新失败')
  }
}


export async function deleteTask(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  
  try {
    await pool.query('UPDATE tasks SET is_active = false WHERE id = $1 AND family_id = $2', [id, user.family_id])
    ctx.body = success({ message: '已删除' })
  } catch (err) {
    ctx.body = error(500, '删除失败')
  }
}

export async function getStudentTaskStatus(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '无权限')
    return
  }
  
  try {
    // 查询所有待审批记录（不限时间）
    const logsResult = await pool.query(
      `SELECT tl.*, u.nickname as user_nickname, t.title as task_title, t.star_reward, t.frequency
       FROM task_logs tl 
       JOIN users u ON tl.user_id = u.id 
       JOIN tasks t ON tl.task_id = t.id 
       WHERE u.family_id = $1 
         AND tl.action = 'complete'
         AND tl.approval_status = 'pending'
       ORDER BY tl.created_at DESC 
       LIMIT 50`,
      [user.family_id]
    )
    ctx.body = success(logsResult.rows)
  } catch (err) {
    console.error('GetStudentTaskStatus error:', err)
    ctx.body = error(500, '获取失败')
  }
}

// 获取本周期的任务完成状态（approved + pending），用于任务页面显示
export async function getCycleTaskStatus(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '无权限')
    return
  }
  
  try {
    // 计算时间范围
    const now = new Date()
    const todayStart = getBeijingMidnightUTC(now)
    const weekStart = getBeijingWeekStartUTC(now)
    
    // 查询本周期的所有完成记录（approved + pending）
    const logsResult = await pool.query(
      `SELECT tl.*, u.nickname as user_nickname, t.title as task_title, t.star_reward, t.frequency
       FROM task_logs tl 
       JOIN users u ON tl.user_id = u.id 
       JOIN tasks t ON tl.task_id = t.id 
       WHERE u.family_id = $1 
         AND tl.action = 'complete'
         AND (
           (t.frequency = 'daily' AND tl.created_at >= $2::timestamptz)
           OR (t.frequency = 'weekly' AND tl.created_at >= $3::timestamptz)
           OR (t.frequency = 'once')
         )
       ORDER BY tl.created_at DESC`,
      [user.family_id, todayStart.toISOString(), weekStart.toISOString()]
    )
    ctx.body = success(logsResult.rows)
  } catch (err) {
    console.error('GetCycleTaskStatus error:', err)
    ctx.body = error(500, '获取失败')
  }
}

export async function approveTaskLog(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '无权限')
    return
  }
  
  const { id } = ctx.params
  const { approved, taskType } = ctx.request.body
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    const logResult = await client.query('SELECT * FROM task_logs WHERE id = $1', [id])
    if (logResult.rows.length === 0) {
      await client.query('ROLLBACK')
      ctx.body = error(404, '记录不存在')
      return
    }
    
    const log = logResult.rows[0]
    
    await client.query(
      'UPDATE task_logs SET approval_status = $1 WHERE id = $2',
      [approved ? 'approved' : 'rejected', id]
    )
    
    let newAchievements = []
    
    if (approved) {
      const starsEarned = log.stars_earned || 1
      
      // 使用统一积分服务增加星星
      const pointsResult = await addPoints(log.user_id, starsEarned, PointType.TASK_APPROVE, {
        sourceId: log.id,
        description: `完成任务获得 ${starsEarned} 星星`
      })
      
      // 积分发放失败则回滚
      if (!pointsResult.success) {
        await client.query('ROLLBACK')
        ctx.body = error(3003, pointsResult.error || '积分发放失败')
        return
      }
      
      // 成就奖励（贴纸在学生完成任务时已发放）
      try {
        const rewardsModule = await import('./rewards.js')
        const { checkAndAwardAchievements } = rewardsModule
        newAchievements = await checkAndAwardAchievements(log.user_id)
      } catch (e) {
        console.error('Achievement award error:', e)
      }
    }
    
    await client.query('COMMIT')
    ctx.body = success({ 
      message: approved ? '已批准' : '已拒绝',
      starsAdded: approved ? (log.stars_earned || 1) : 0,
      newAchievements: newAchievements
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('ApproveTaskLog error:', err)
    ctx.body = error(500, '操作失败')
  }
}

export async function deductStars(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '只有家长可以扣分')
    return
  }
  
  const { studentId, stars, reason } = ctx.request.body
  
  // 输入验证
  if (!studentId || typeof studentId !== 'string') {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '学生ID无效')
    return
  }
  if (!stars || isNaN(parseInt(stars)) || parseInt(stars) <= 0) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '扣减星星数量必须为正整数')
    return
  }
  if (reason && reason.length > 200) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '原因不能超过200字符')
    return
  }
  
  const deductStars = Math.abs(parseInt(stars))
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // 检查学生是否存在且属于该家庭
    const studentResult = await client.query(
      'SELECT id, stars, nickname FROM users WHERE id = $1 AND family_id = $2',
      [studentId, user.family_id]
    )
    
    if (studentResult.rows.length === 0) {
      await client.query('ROLLBACK')
      ctx.body = error(404, '学生不存在')
      return
    }
    
    const student = studentResult.rows[0]
    
    // 使用统一积分服务扣除星星
    const deductResult = await subtractPoints(studentId, deductStars, PointType.DEDUCT, {
      description: `家长扣分：${reason || '无原因'}（-${deductStars}）`
    })
    
    if (!deductResult.success) {
      await client.query('ROLLBACK')
      ctx.body = error(3003, deductResult.error || '扣分失败')
      return
    }
    
    // 记录到 task_logs（作为一种特殊的惩罚记录，task_id 设为 NULL）
    await client.query(
      'INSERT INTO task_logs (user_id, task_id, action, stars_earned, approval_status, completed_date) VALUES ($1, NULL, $2, $3, $4, CURRENT_DATE)',
      [studentId, 'punishment', -deductStars, 'approved']
    )
    
    await client.query('COMMIT')
    ctx.body = success({ 
      message: '已扣除 ' + student.nickname + ' ' + deductStars + ' 星星',
      deducted: deductStars,
      remainingStars: student.stars - deductStars
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('DeductStars error:', err)
    ctx.body = error(500, '扣分失败')
  }
}
