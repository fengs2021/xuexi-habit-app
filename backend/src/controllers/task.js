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
    
    const result = await pool.query(
      'INSERT INTO task_logs (user_id, task_id, action, stars_earned, approval_status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, id, 'completed', task.star_reward, 'pending']
    )
    
    ctx.body = success({ message: '已完成申请，请等待家长审批', log: result.rows[0] })
  } catch (err) {
    console.error('CompleteTask error:', err)
    ctx.body = error(500, '操作失败')
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
