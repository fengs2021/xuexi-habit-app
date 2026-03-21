import Router from "@koa/router"
import pool from "../config/database.js"
import { success } from "../utils/response.js"

const router = new Router({ prefix: "/api/statistics" })

router.get("/daily-stars/:childId", async (ctx) => {
  const { childId } = ctx.params
  const result = []
  for (let i = 0; i <= 29; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dateStr = month + "月" + day + "日"
    const dateStr2 = date.toISOString().split("T")[0]
    const res = await pool.query(
      "SELECT COALESCE(SUM(stars_earned), 0) as stars FROM task_logs WHERE user_id = $1 AND completed_date = $2",
      [childId, dateStr2]
    )
    result.push({
      date: dateStr,
      stars: parseInt(res.rows[0]?.stars || 0)
    })
  }
  ctx.body = success(result)
})

router.get("/daily-tasks/:childId", async (ctx) => {
  const { childId } = ctx.params
  const { offset = 0, limit = 7 } = ctx.query
  
  const res = await pool.query(`
    SELECT 
      tl.completed_date,
      t.title,
      t.icon,
      tl.stars_earned,
      tl.action,
      t.star_reward
    FROM task_logs tl
    JOIN tasks t ON tl.task_id = t.id
    WHERE tl.user_id = $1
    ORDER BY tl.completed_date DESC, tl.created_at DESC
    LIMIT $2 OFFSET $3
  `, [childId, parseInt(limit), parseInt(offset)])
  
  const countRes = await pool.query(`
    SELECT COUNT(DISTINCT completed_date) as total_days FROM task_logs WHERE user_id = $1
  `, [childId])
  
  ctx.body = success({
    items: res.rows,
    totalDays: parseInt(countRes.rows[0]?.total_days || 0),
    hasMore: parseInt(offset) + res.rows.length < parseInt(countRes.rows[0]?.total_days || 0)
  })
})

// Get newly earned achievements and stickers for notification
router.get("/new-rewards/:childId", async (ctx) => {
  const { childId } = ctx.params
  
  // Get achievements unlocked in last 24 hours
  const achievementsRes = await pool.query(`
    SELECT a.id, a.name, a.description, a.reward_stars, ua.unlocked_at
    FROM user_achievements ua
    JOIN achievement_definitions a ON ua.achievement_id = a.id
    WHERE ua.user_id = $1 AND ua.unlocked_at > NOW() - INTERVAL '24 hours'
    ORDER BY ua.unlocked_at DESC
  `, [childId])
  
  // Get stickers earned in last 24 hours
  const stickersRes = await pool.query(`
    SELECT s.id, s.emoji, s.name, s.rarity, us.earned_at
    FROM user_stickers us
    JOIN stickers s ON us.sticker_id = s.id
    WHERE us.user_id = $1 AND us.earned_at > NOW() - INTERVAL '24 hours'
    ORDER BY us.earned_at DESC
  `, [childId])
  
  ctx.body = success({
    achievements: achievementsRes.rows,
    stickers: stickersRes.rows
  })
})

export default router
