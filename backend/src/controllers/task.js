import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'

export async function getTasks(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    const userResult = await pool.query('SELECT family_id FROM users WHERE id = $1', [decoded.id])
    if (userResult.rows.length === 0) {
      ctx.body = error(ErrorCodes.USER_NOT_FOUND, '用户不存在')
      return
    }
    const result = await pool.query(
      'SELECT * FROM tasks WHERE family_id = $1 AND is_active = true ORDER BY sort_order, created_at DESC',
      [userResult.rows[0].family_id]
    )
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetTasks error:', err)
    ctx.body = error(500, '获取任务失败')
  }
}

export async function createTask(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    const { title, icon, starReward, rarity, frequency, goalId } = ctx.request.body
    const userResult = await pool.query('SELECT family_id FROM users WHERE id = $1', [decoded.id])
    if (userResult.rows.length === 0) {
      ctx.body = error(ErrorCodes.USER_NOT_FOUND, '用户不存在')
      return
    }
    const result = await pool.query(
      'INSERT INTO tasks (family_id, goal_id, title, icon, star_reward, rarity, frequency) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userResult.rows[0].family_id, goalId || null, title, icon || 'todo-o', starReward || 1, rarity || 'N', frequency || 'daily']
    )
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('CreateTask error:', err)
    ctx.body = error(500, '创建任务失败')
  }
}

export async function updateTask(ctx) {
  ctx.body = error(500, '功能开发中')
}

export async function deleteTask(ctx) {
  ctx.body = error(500, '功能开发中')
}

export async function completeTask(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    const taskId = ctx.params.id
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId])
    if (taskResult.rows.length === 0) {
      ctx.body = error(ErrorCodes.TASK_NOT_FOUND, '任务不存在')
      return
    }
    const task = taskResult.rows[0]
    await pool.query(
      'INSERT INTO task_logs (user_id, task_id, action, stars_earned) VALUES ($1, $2, $3, $4)',
      [decoded.id, taskId, 'complete', task.star_reward]
    )
    const userResult = await pool.query('SELECT stars FROM users WHERE id = $1', [decoded.id])
    const newStars = (userResult.rows[0]?.stars || 0) + task.star_reward
    await pool.query('UPDATE users SET stars = $1 WHERE id = $2', [newStars, decoded.id])
    ctx.body = success({ starsEarned: task.star_reward, totalStars: newStars })
  } catch (err) {
    console.error('CompleteTask error:', err)
    ctx.body = error(500, '完成任务失败')
  }
}

export async function skipTask(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    const taskId = ctx.params.id
    await pool.query(
      'INSERT INTO task_logs (user_id, task_id, action, stars_earned) VALUES ($1, $2, $3, $4)',
      [decoded.id, taskId, 'skip', 0]
    )
    ctx.body = success({ skipped: true })
  } catch (err) {
    console.error('SkipTask error:', err)
    ctx.body = error(500, '跳过任务失败')
  }
}
