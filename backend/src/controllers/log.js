import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'

export async function getLogs(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(1002, '未登录')
    return
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)

    const { limit = 50, offset = 0 } = ctx.query

    const result = await pool.query(
      'SELECT tl.*, t.title as task_title, t.icon as task_icon FROM task_logs tl LEFT JOIN tasks t ON tl.task_id = t.id WHERE tl.user_id = $1 ORDER BY tl.created_at DESC LIMIT $2 OFFSET $3',
      [decoded.id, limit, offset]
    )

    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetLogs error:', err)
    ctx.body = error(500, '获取日志失败')
  }
}
