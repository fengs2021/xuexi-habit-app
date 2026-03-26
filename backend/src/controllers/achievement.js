import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'

export async function getAchievements(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(1002, '未登录')
    return
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)

    const result = await pool.query('SELECT * FROM achievements WHERE user_id = $1 ORDER BY created_at DESC', [decoded.id])

    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetAchievements error:', err)
    ctx.body = error(500, '获取成就失败')
  }
}

export async function getAchievementStats(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(1002, '未登录')
    return
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)

    const userResult = await pool.query('SELECT level, stars FROM users WHERE id = $1', [decoded.id])
    const taskCountResult = await pool.query('SELECT COUNT(*) as count FROM task_logs WHERE user_id = $1 AND action = \'complete\'', [decoded.id])
    const goalCountResult = await pool.query('SELECT COUNT(*) as count FROM achievements WHERE user_id = $1 AND type = \'goal_completed\'', [decoded.id])

    ctx.body = success({
      stats: {
        goalsAchieved: parseInt(goalCountResult.rows[0].count),
        totalStars: userResult.rows[0]?.stars || 0,
        tasksCompleted: parseInt(taskCountResult.rows[0].count),
        level: userResult.rows[0]?.level || 1
      }
    })
  } catch (err) {
    console.error('GetAchievementStats error:', err)
    ctx.body = error(500, '获取统计失败')
  }
}
