import Router from "@koa/router"
import pool from "../config/database.js"
import { success } from "../utils/response.js"

const router = new Router({prefix: "/api/statistics"})

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

export default router
