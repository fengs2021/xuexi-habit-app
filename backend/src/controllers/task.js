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
    let cycleStart = new Date()
    cycleStart.setHours(0, 0, 0, 0)
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - diff)
    weekStart.setHours(0, 0, 0, 0)
    
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
      
      const logResult = await pool.query(
        'SELECT approval_status FROM task_logs WHERE user_id = $1 AND task_id = $2 AND action = $3 AND created_at >= $4 ORDER BY created_at DESC LIMIT 1',
        [user.id, task.id, 'complete', checkTime.toISOString()]
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
  
  try {
    const result = await pool.query(
      'INSERT INTO tasks (family_id, title, star_reward, frequency) VALUES ($1, $2, $3, $4) RETURNING *',
      [user.family_id, title, starReward || 1, frequency || 'daily']
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
      let cycleStart = new Date()
      cycleStart.setHours(0, 0, 0, 0)
      
      if (task.frequency === 'weekly') {
        const dayOfWeek = now.getDay()
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        cycleStart = new Date(now)
        cycleStart.setDate(now.getDate() - diff)
        cycleStart.setHours(0, 0, 0, 0)
      }
      
      const existingResult = await pool.query(
        `SELECT id FROM task_logs WHERE user_id = $1 AND task_id = $2 AND action = 'complete' AND created_at >= $3 LIMIT 1`,
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
    
    ctx.body = success({ message: '已完成申请，请等待家长审批' })
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
      let cycleStart = new Date()
      cycleStart.setHours(0, 0, 0, 0)
      
      if (frequency === 'weekly') {
        const dayOfWeek = now.getDay()
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        cycleStart = new Date(now)
        cycleStart.setDate(now.getDate() - diff)
        cycleStart.setHours(0, 0, 0, 0)
      }
      
      const existingResult = await pool.query(
        `SELECT id FROM task_logs WHERE user_id = $1 AND task_id = $2 AND action IN ('complete', 'skipped') AND created_at >= $3 LIMIT 1`,
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
    const logsResult = await pool.query(
      'SELECT tl.*, u.nickname as user_nickname, t.title as task_title, t.star_reward FROM task_logs tl JOIN users u ON tl.user_id = u.id JOIN tasks t ON tl.task_id = t.id WHERE u.family_id = $1 AND tl.action = $2 ORDER BY tl.created_at DESC LIMIT 50',
      [user.family_id, 'complete']
    )
    ctx.body = success(logsResult.rows)
  } catch (err) {
    console.error('GetStudentTaskStatus error:', err)
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
    
    let stickerResult = null
    let newAchievements = []
    
    if (approved) {
      const starsEarned = log.stars_earned || 1
      
      // 使用统一积分服务增加星星
      await addPoints(log.user_id, starsEarned, PointType.TASK_APPROVE, {
        sourceId: log.id,
        description: `完成任务获得 ${starsEarned} 星星`
      })
      
      // 导入奖励函数并发放贴纸
      try {
        const rewardsModule = await import('./rewards.js')
        const { awardRandomSticker, checkAndAwardAchievements } = rewardsModule
        stickerResult = await awardRandomSticker(log.user_id, taskType || 'daily')
        newAchievements = await checkAndAwardAchievements(log.user_id)
      } catch (e) {
        console.error('Award error:', e)
      }
    }
    
    await client.query('COMMIT')
    ctx.body = success({ 
      message: approved ? '已批准' : '已拒绝',
      starsAdded: approved ? (log.stars_earned || 1) : 0,
      sticker: stickerResult,
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
  
  if (!studentId || !stars) {
    ctx.body = error(400, '参数不完整')
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
