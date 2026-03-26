import Router from "@koa/router"
import pool from "../config/database.js"
import { success } from "../utils/response.js"

const router = new Router({ prefix: "/api/backup" })

// 导出用户数据
router.get("/export/:userId", async (ctx) => {
  const { userId } = ctx.params
  
  try {
    // 获取用户信息
    const userRes = await pool.query("SELECT id, nickname, role, stars, created_at FROM users WHERE id = $1", [userId])
    if (userRes.rows.length === 0) {
      ctx.body = { code: 1001, message: "用户不存在", data: null }
      return
    }
    const user = userRes.rows[0]
    
    // 获取家庭信息
    let family = null
    if (user.family_id) {
      const familyRes = await pool.query("SELECT * FROM family WHERE id = $1", [user.family_id])
      family = familyRes.rows[0] || null
    }
    
    // 获取目标
    const goalsRes = await pool.query("SELECT * FROM goals WHERE user_id = $1 OR family_id = $2", [userId, user.family_id || null])
    
    // 获取任务
    const tasksRes = await pool.query(`
      SELECT t.*, tl.action, tl.stars_earned, tl.completed_date 
      FROM tasks t
      LEFT JOIN task_logs tl ON t.id = tl.task_id AND tl.user_id = $1
      WHERE t.family_id = $2
      ORDER BY t.created_at
    `, [userId, user.family_id || null])
    
    // 获取成就
    const achievementsRes = await pool.query(`
      SELECT a.*, ua.unlocked_at FROM achievement_definitions a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = $1
    `, [userId])
    
    // 获取贴纸
    const stickersRes = await pool.query(`
      SELECT s.*, us.earned_at FROM stickers s
      JOIN user_stickers us ON s.id = us.sticker_id
      WHERE us.user_id = $1
    `, [userId])
    
    // 获取兑换记录
    const exchangesRes = await pool.query(`
      SELECT el.*, r.title as reward_title FROM exchange_logs el
      JOIN rewards r ON el.reward_id = r.id
      WHERE el.user_id = $1
      ORDER BY el.created_at DESC
    `, [userId])
    
    // 获取签到记录
    const signinsRes = await pool.query(`
      SELECT * FROM user_signins WHERE user_id = $1 ORDER BY sign_date DESC LIMIT 30
    `, [userId])
    
    ctx.body = success({
      exportTime: new Date().toISOString(),
      user,
      family,
      goals: goalsRes.rows,
      tasks: tasksRes.rows,
      achievements: achievementsRes.rows,
      stickers: stickersRes.rows,
      exchanges: exchangesRes.rows,
      signins: signinsRes.rows
    })
  } catch (error) {
    console.error('Export error:', error)
    ctx.body = { code: 500, message: error.message, data: null }
  }
})

// 备份整个家庭数据（家长用）
router.get("/family/:familyId", async (ctx) => {
  const { familyId } = ctx.params
  
  try {
    // 获取家庭信息
    const familyRes = await pool.query("SELECT * FROM family WHERE id = $1", [familyId])
    if (familyRes.rows.length === 0) {
      ctx.body = { code: 1001, message: "家庭不存在", data: null }
      return
    }
    const family = familyRes.rows[0]
    
    // 获取所有家庭成员
    const membersRes = await pool.query(`
      SELECT id, nickname, role, stars, created_at FROM users WHERE family_id = $1
    `, [familyId])
    
    // 获取所有目标
    const goalsRes = await pool.query("SELECT * FROM goals WHERE family_id = $1", [familyId])
    
    // 获取所有任务
    const tasksRes = await pool.query("SELECT * FROM tasks WHERE family_id = $1", [familyId])
    
    // 获取所有奖励
    const rewardsRes = await pool.query("SELECT * FROM rewards WHERE family_id = $1", [familyId])
    
    // 获取所有兑换记录
    const exchangesRes = await pool.query(`
      SELECT el.*, r.title as reward_title, u.nickname as user_nickname 
      FROM exchange_logs el
      JOIN rewards r ON el.reward_id = r.id
      JOIN users u ON el.user_id = u.id
      WHERE r.family_id = $1
      ORDER BY el.created_at DESC
    `, [familyId])
    
    ctx.body = success({
      backupTime: new Date().toISOString(),
      family,
      members: membersRes.rows,
      goals: goalsRes.rows,
      tasks: tasksRes.rows,
      rewards: rewardsRes.rows,
      exchanges: exchangesRes.rows
    })
  } catch (error) {
    console.error('Backup error:', error)
    ctx.body = { code: 500, message: error.message, data: null }
  }
})

// 获取备份历史
router.get("/history/:familyId", async (ctx) => {
  ctx.body = success({
    lastBackup: null,
    message: "备份功能即将推出"
  })
})

export default router
