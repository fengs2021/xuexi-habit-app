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

export async function getTasks(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE family_id = $1 AND is_active = true ORDER BY sort_order, created_at DESC',
      [user.family_id]
    )
    
    const tasks = result.rows
    
    // Calculate cycle start time for completion check
    const now = new Date()
    let cycleStart = new Date()
    cycleStart.setHours(0, 0, 0, 0)
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - diff)
    weekStart.setHours(0, 0, 0, 0)
    
    // Check completion status for each task
    for (const task of tasks) {
      let completedInCycle = false
      let pendingApproval = false
      
      if (task.frequency === 'daily') {
        const logResult = await pool.query(
          'SELECT approval_status FROM task_logs WHERE user_id = $1 AND task_id = $2 AND action = $3 AND created_at >= $4 ORDER BY created_at DESC LIMIT 1',
          [user.id, task.id, 'completed', cycleStart.toISOString()]
        )
        if (logResult.rows.length > 0) {
          completedInCycle = true
          pendingApproval = logResult.rows[0].approval_status === 'pending'
        }
      } else if (task.frequency === 'weekly') {
        const logResult = await pool.query(
          'SELECT approval_status FROM task_logs WHERE user_id = $1 AND task_id = $2 AND action = $3 AND created_at >= $4 ORDER BY created_at DESC LIMIT 1',
          [user.id, task.id, 'completed', weekStart.toISOString()]
        )
        if (logResult.rows.length > 0) {
          completedInCycle = true
          pendingApproval = logResult.rows[0].approval_status === 'pending'
        }
      } else if (task.frequency === 'once') {
        const logResult = await pool.query(
          'SELECT approval_status FROM task_logs WHERE user_id = $1 AND task_id = $2 AND action = $3 ORDER BY created_at DESC LIMIT 1',
          [user.id, task.id, 'completed']
        )
        if (logResult.rows.length > 0) {
          completedInCycle = true
          pendingApproval = logResult.rows[0].approval_status === 'pending'
        }
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
      'SELECT * FROM tasks WHERE id =  AND family_id = ',
      [id, user.family_id]
    )
    
    if (taskResult.rows.length === 0) {
      ctx.body = error(404, '任务不存在')
      return
    }
    
    const task = taskResult.rows[0]
    
    // Check if already completed this cycle
    const now = new Date()
    let cycleStart = new Date()
    
    if (task.frequency === 'daily') {
      cycleStart.setHours(0, 0, 0, 0)
    } else if (task.frequency === 'weekly') {
      const dayOfWeek = cycleStart.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      cycleStart.setDate(cycleStart.getDate() - diff)
      cycleStart.setHours(0, 0, 0, 0)
    } else if (task.frequency === 'once') {
      const onceCheck = await pool.query(
        'SELECT * FROM task_logs WHERE user_id =  AND task_id =  AND action =  AND approval_status != ',
        [user.id, id, 'completed', 'rejected']
      )
      if (onceCheck.rows.length > 0) {
        ctx.body = error(400, '该任务已完成')
        return
      }
    }
    
    if (task.frequency !== 'once') {
      const existingCompletion = await pool.query(
        'SELECT * FROM task_logs WHERE user_id =  AND task_id =  AND action =  AND created_at >=  AND approval_status != ',
        [user.id, id, 'completed', cycleStart.toISOString(), 'rejected']
      )
      if (existingCompletion.rows.length > 0) {
        ctx.body = error(400, '本周/日已完成该任务')
        return
      }
    }
    
    const result = await pool.query(
      'INSERT INTO task_logs (user_id, task_id, action, stars_earned, approval_status) VALUES (, , , , ) RETURNING *',
      [user.id, id, 'completed', task.star_reward, 'pending']
    )
    
    ctx.body = success({ message: '已完成申请，请等待家长审批', log: result.rows[0] })
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
    await pool.query(
      'INSERT INTO task_logs (user_id, task_id, action, stars_earned, approval_status) VALUES ($1, $2, $3, 0, $4)',
      [user.id, id, 'skipped', 'approved']
    )
    ctx.body = success({ message: '已跳过' })
  } catch (err) {
    ctx.body = error(500, '操作失败')
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
