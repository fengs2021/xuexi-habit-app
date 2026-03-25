import Router from "@koa/router"
import pool from "../config/database.js"
import { success } from "../utils/response.js"

const router = new Router({ prefix: "/api/statistics" })

// 获取近30日每日星星统计（优化：使用单次查询）
router.get("/daily-stars/:childId", async (ctx) => {
  const { childId } = ctx.params
  
  try {
    // 计算日期范围
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 29)
    
    const startStr = startDate.toISOString().split('T')[0]
    const endStr = endDate.toISOString().split('T')[0]
    
    // 单次查询获取所有日期的星星总和
    const result = await pool.query(`
      SELECT 
        completed_date,
        COALESCE(SUM(stars_earned), 0) as stars
      FROM task_logs 
      WHERE user_id = $1 
        AND completed_date >= $2 
        AND completed_date <= $3
        AND approval_status = 'approved'
      GROUP BY completed_date
      ORDER BY completed_date DESC
    `, [childId, startStr, endStr])
    
    // 构建结果映射
    const starsByDate = {}
    for (const row of result.rows) {
      const dateStr = new Date(row.completed_date).toISOString().split('T')[0]
      starsByDate[dateStr] = parseInt(row.stars)
    }
    
    // 填充所有日期（包括没有数据的日期）
    const response = []
    for (let i = 0; i <= 29; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const month = date.getMonth() + 1
      const day = date.getDate()
      const dateStr = month + "月" + day + "日"
      const dateStr2 = date.toISOString().split('T')[0]
      
      response.push({
        date: dateStr,
        dateKey: dateStr2,
        stars: starsByDate[dateStr2] || 0
      })
    }
    
    ctx.body = success(response)
  } catch (err) {
    console.error('Get daily stars error:', err)
    ctx.body = success([])
  }
})

// 获取每日任务完成详情（分页）
router.get("/daily-tasks/:childId", async (ctx) => {
  const { childId } = ctx.params
  const { offset = 0, limit = 7 } = ctx.query
  
  try {
    const res = await pool.query(`
      SELECT 
        tl.completed_date,
        tl.action,
        tl.stars_earned,
        t.title,
        t.icon,
        t.star_reward,
        t.rarity
      FROM task_logs tl
      JOIN tasks t ON tl.task_id = t.id
      WHERE tl.user_id = $1 
        AND tl.approval_status = 'approved'
        AND tl.action IN ('complete', 'skipped')
      ORDER BY tl.completed_date DESC, tl.created_at DESC
      LIMIT $2 OFFSET $3
    `, [childId, parseInt(limit), parseInt(offset)])
    
    // 获取总天数
    const countRes = await pool.query(`
      SELECT COUNT(DISTINCT completed_date) as total_days 
      FROM task_logs 
      WHERE user_id = $1 AND approval_status = 'approved'
    `, [childId])
    
    const totalDays = parseInt(countRes.rows[0]?.total_days) || 0
    const currentOffset = parseInt(offset) + res.rows.length
    
    ctx.body = success({
      items: res.rows,
      totalDays,
      hasMore: currentOffset < totalDays
    })
  } catch (err) {
    console.error('Get daily tasks error:', err)
    ctx.body = success({ items: [], totalDays: 0, hasMore: false })
  }
})

// 获取24小时内新获得的成就和贴纸（用于弹窗提醒）
router.get("/new-rewards/:childId", async (ctx) => {
  const { childId } = ctx.params
  
  try {
    // 获取最近一次弹窗时间（避免重复弹窗）
    // 这里直接查询24小时内的最新数据
    
    const achievementsRes = await pool.query(`
      SELECT a.id, a.name, a.description, a.reward_stars, ua.unlocked_at
      FROM user_achievements ua
      JOIN achievement_definitions a ON ua.achievement_id = a.id
      WHERE ua.user_id = $1 
        AND ua.unlocked_at > NOW() - INTERVAL '24 hours'
      ORDER BY ua.unlocked_at DESC
    `, [childId])
    
    const stickersRes = await pool.query(`
      SELECT s.id, s.emoji, s.name, s.rarity, us.earned_at
      FROM user_stickers us
      JOIN stickers s ON us.sticker_id = s.id
      WHERE us.user_id = $1 
        AND us.earned_at > NOW() - INTERVAL '24 hours'
      ORDER BY us.earned_at DESC
    `, [childId])
    
    ctx.body = success({
      achievements: achievementsRes.rows,
      stickers: stickersRes.rows,
      hasNew: achievementsRes.rows.length > 0 || stickersRes.rows.length > 0
    })
  } catch (err) {
    console.error('Get new rewards error:', err)
    ctx.body = success({ achievements: [], stickers: [], hasNew: false })
  }
})

// 工具函数：获取本地日期字符串 YYYY-MM-DD
function getLocalDateStr(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取本周统计数据（供Dashboard使用）
router.get("/week-summary/:childId", async (ctx) => {
  const { childId } = ctx.params
  
  try {
    const now = new Date()
    const dayOfWeek = now.getDay() || 7
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek + 1)
    // 使用本地日期而非 toISOString()（避免 UTC 时区偏移问题）
    const weekStartStr = getLocalDateStr(weekStart)
    const todayStr = getLocalDateStr(now)
    
    // 本周任务统计
    const weekStatsRes = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE action = 'complete' AND approval_status = 'approved') as completed,
        COUNT(*) FILTER (WHERE action = 'skipped') as skipped,
        COALESCE(SUM(stars_earned) FILTER (WHERE action = 'complete' AND approval_status = 'approved'), 0) as stars
      FROM task_logs 
      WHERE user_id = $1 AND completed_date >= $2 AND completed_date <= $3
    `, [childId, weekStartStr, todayStr])
    
    // 本周签到天数
    const signinRes = await pool.query(`
      SELECT COUNT(*) as days FROM user_signins 
      WHERE user_id = $1 AND sign_date >= $2 AND sign_date <= $3
    `, [childId, weekStartStr, todayStr])
    
    const weekStats = weekStatsRes.rows[0]
    const completed = parseInt(weekStats.completed) || 0
    const skipped = parseInt(weekStats.skipped) || 0
    const total = completed + skipped
    
    ctx.body = success({
      weekStart: weekStartStr,
      today: todayStr,
      tasksCompleted: completed,
      tasksSkipped: skipped,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      starsEarned: parseInt(weekStats.stars) || 0,
      signinDays: parseInt(signinRes.rows[0]?.days) || 0
    })
  } catch (err) {
    console.error('Get week summary error:', err)
    ctx.body = success({
      weekStart: '',
      today: '',
      tasksCompleted: 0,
      tasksSkipped: 0,
      completionRate: 0,
      starsEarned: 0,
      signinDays: 0
    })
  }
})

export default router
