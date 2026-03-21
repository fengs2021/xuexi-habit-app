import Router from "@koa/router"
import pool from "../config/database.js"
import { success } from "../utils/response.js"

const router = new Router({ prefix: "/api/report" })

router.get("/weekly/:childId", async (ctx) => {
  const { childId } = ctx.params
  
  try {
    const now = new Date()
    const dayOfWeek = now.getDay() || 7
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek + 1)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]
    
    let reportRes = await pool.query(
      "SELECT * FROM weekly_reports WHERE user_id = $1 AND week_start = $2",
      [childId, weekStartStr]
    )
    
    let report = reportRes.rows[0] || null
    
    if (!report) {
      report = await generateWeeklyReport(childId, weekStartStr, weekEndStr)
    }
    
    ctx.body = success(report)
  } catch (error) {
    console.error('Get weekly report error:', error)
    ctx.body = { code: 500, message: error.message, data: null }
  }
})

router.put("/weekly/:childId/viewed", async (ctx) => {
  const { childId } = ctx.params
  
  try {
    const now = new Date()
    const dayOfWeek = now.getDay() || 7
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek + 1)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    
    await pool.query(
      "UPDATE weekly_reports SET viewed = true WHERE user_id = $1 AND week_start = $2",
      [childId, weekStartStr]
    )
    
    ctx.body = success({ viewed: true })
  } catch (error) {
    console.error('Mark viewed error:', error)
    ctx.body = { code: 500, message: error.message, data: null }
  }
})

async function generateWeeklyReport(userId, weekStartStr, weekEndStr) {
  const userRes = await pool.query("SELECT nickname FROM users WHERE id = $1", [userId])
  const nickname = userRes.rows[0]?.nickname || '未知'
  
  const taskStatsRes = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE action = 'completed') as completed,
      COUNT(*) FILTER (WHERE action = 'skipped') as skipped,
      COALESCE(SUM(stars_earned) FILTER (WHERE action = 'completed'), 0) as stars_earned
    FROM task_logs 
    WHERE user_id = $1 AND completed_date >= $2 AND completed_date <= $3
  `, [userId, weekStartStr, weekEndStr])
  
  const dailyRes = await pool.query(`
    SELECT completed_date, COUNT(*) as total,
      COUNT(*) FILTER (WHERE action = 'completed') as completed,
      COUNT(*) FILTER (WHERE action = 'skipped') as skipped,
      COALESCE(SUM(stars_earned) FILTER (WHERE action = 'completed'), 0) as stars
    FROM task_logs
    WHERE user_id = $1 AND completed_date >= $2 AND completed_date <= $3
    GROUP BY completed_date ORDER BY completed_date
  `, [userId, weekStartStr, weekEndStr])
  
  const signinRes = await pool.query(`
    SELECT sign_date, streak_days, bonus_stars FROM user_signins 
    WHERE user_id = $1 AND sign_date >= $2 AND sign_date <= $3 ORDER BY sign_date
  `, [userId, weekStartStr, weekEndStr])
  
  const achievementsRes = await pool.query(`
    SELECT a.name, a.description, a.reward_stars, ua.unlocked_at
    FROM user_achievements ua JOIN achievement_definitions a ON ua.achievement_id = a.id
    WHERE ua.user_id = $1 AND DATE(ua.unlocked_at) >= $2 AND DATE(ua.unlocked_at) <= $3
  `, [userId, weekStartStr, weekEndStr])
  
  const stickersRes = await pool.query(`
    SELECT s.emoji, s.name, s.rarity, us.earned_at
    FROM user_stickers us JOIN stickers s ON us.sticker_id = s.id
    WHERE us.user_id = $1 AND DATE(us.earned_at) >= $2 AND DATE(us.earned_at) <= $3
  `, [userId, weekStartStr, weekEndStr])
  
  const lastWeekStart = new Date(weekStartStr)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(weekEndStr)
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)
  const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0]
  const lastWeekEndStr = lastWeekEnd.toISOString().split('T')[0]
  
  const lastWeekRes = await pool.query(`
    SELECT COUNT(*) FILTER (WHERE action = 'completed') as completed,
      COALESCE(SUM(stars_earned) FILTER (WHERE action = 'completed'), 0) as stars
    FROM task_logs WHERE user_id = $1 AND completed_date >= $2 AND completed_date <= $3
  `, [userId, lastWeekStartStr, lastWeekEndStr])
  
  const taskStats = taskStatsRes.rows[0]
  const lastWeekStats = lastWeekRes.rows[0] || { completed: 0, stars: 0 }
  
  const completed = parseInt(taskStats.completed) || 0
  const skipped = parseInt(taskStats.skipped) || 0
  const total = completed + skipped
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  
  const reportData = {
    week_start: weekStartStr, week_end: weekEndStr, user_nickname: nickname,
    summary: {
      total_tasks: total, completed, skipped,
      completion_rate: completionRate,
      stars_earned: parseInt(taskStats.stars_earned) || 0,
      signin_days: signinRes.rows.length,
      new_achievements: achievementsRes.rows.length,
      new_stickers: stickersRes.rows.length
    },
    comparison: {
      last_week_completed: parseInt(lastWeekStats.completed) || 0,
      last_week_stars: parseInt(lastWeekStats.stars) || 0,
      completed_change: completed - (parseInt(lastWeekStats.completed) || 0),
      stars_change: (parseInt(taskStats.stars_earned) || 0) - (parseInt(lastWeekStats.stars) || 0)
    },
    daily_details: dailyRes.rows.map(row => ({
      date: row.completed_date,
      total: parseInt(row.total) || 0,
      completed: parseInt(row.completed) || 0,
      skipped: parseInt(row.skipped) || 0,
      stars: parseInt(row.stars) || 0
    })),
    signins: signinRes.rows,
    new_achievements: achievementsRes.rows,
    new_stickers: stickersRes.rows,
    viewed: false
  }
  
  const insertRes = await pool.query(`
    INSERT INTO weekly_reports (user_id, week_start, week_end, data, viewed)
    VALUES ($1, $2, $3, $4, false)
    ON CONFLICT (user_id, week_start) DO UPDATE SET data = $4, viewed = false RETURNING *
  `, [userId, weekStartStr, weekEndStr, JSON.stringify(reportData)])
  
  return insertRes.rows[0]
}

export default router
