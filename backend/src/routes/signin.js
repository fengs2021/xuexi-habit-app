import Router from '@koa/router'
import pool from '../config/database.js'
import { success } from '../utils/response.js'

const router = new Router({ prefix: '/api/signin' })

// 签到奖励规则：1,1,2,2,2,3,5（七天循环）
const SIGNIN_REWARDS = [1, 1, 2, 2, 2, 3, 5]

// 获取今日签到信息
router.get('/info/:userId', async (ctx) => {
  const { userId } = ctx.params
  
  // 获取用户最后签到记录
  const lastSignResult = await pool.query(
    'SELECT sign_date, streak_days FROM user_signins WHERE user_id = $1 ORDER BY sign_date DESC LIMIT 1',
    [userId]
  )
  
  const today = new Date().toISOString().split('T')[0]
  let checkedIn = false
  let streakDays = 0
  let todayBonus = 0
  let canClaim = true
  
  if (lastSignResult.rows.length > 0) {
    const lastSign = lastSignResult.rows[0]
    const lastSignDate = new Date(lastSign.sign_date).toISOString().split('T')[0]
    streakDays = lastSign.streak_days
    
    // 检查今天是否已签到
    if (lastSignDate === today) {
      checkedIn = true
      canClaim = false
    } else {
      // 计算是否连续
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      if (lastSignDate !== yesterdayStr) {
        // 中断了，重置连续天数
        streakDays = 0
      }
    }
  }
  
  // 计算今日签到可获奖励
  if (!checkedIn) {
    const nextStreak = streakDays + 1
    todayBonus = SIGNIN_REWARDS[(nextStreak - 1) % 7]
  }
  
  // 获取本月签到记录
  const monthStart = today.slice(0, 7) + '-01'
  const monthResult = await pool.query(
    'SELECT sign_date FROM user_signins WHERE user_id = $1 AND sign_date >= $2 ORDER BY sign_date',
    [userId, monthStart]
  )
  const monthDays = monthResult.rows.map(r => new Date(r.sign_date).getDate())
  
  ctx.body = success({
    checkedIn,
    streakDays,
    todayBonus,
    canClaim,
    monthDays
  })
})

// 执行签到
router.post('/checkin', async (ctx) => {
  const { userId } = ctx.request.body
  
  if (!userId) {
    ctx.status = 400
    ctx.body = { code: 400, message: '缺少userId' }
    return
  }
  
  const today = new Date().toISOString().split('T')[0]
  
  // 检查今天是否已签到
  const existing = await pool.query(
    'SELECT id FROM user_signins WHERE user_id = $1 AND sign_date = $2',
    [userId, today]
  )
  
  if (existing.rows.length > 0) {
    ctx.status = 200
    ctx.body = { code: 0, message: '今天已签到', data: { alreadySignedIn: true } }
    return
  }
  
  // 获取最后签到记录计算连续天数
  const lastSignResult = await pool.query(
    'SELECT sign_date, streak_days FROM user_signins WHERE user_id = $1 ORDER BY sign_date DESC LIMIT 1',
    [userId]
  )
  
  let newStreak = 1
  if (lastSignResult.rows.length > 0) {
    const lastSign = lastSignResult.rows[0]
    const lastSignDate = new Date(lastSign.sign_date).toISOString().split('T')[0]
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    if (lastSignDate === yesterdayStr) {
      newStreak = lastSign.streak_days + 1
    }
  }
  
  // 计算奖励
  const bonus = SIGNIN_REWARDS[(newStreak - 1) % 7]
  
  // 插入签到记录
  await pool.query(
    'INSERT INTO user_signins (user_id, sign_date, streak_days, bonus_stars) VALUES ($1, $2, $3, $4)',
    [userId, today, newStreak, bonus]
  )
  
  // 给用户增加星星
  await pool.query(
    'UPDATE users SET stars = stars + $1, total_stars = total_stars + $1 WHERE id = $2',
    [bonus, userId]
  )
  
  // 同时更新 user_point_summary
  await pool.query(
    'INSERT INTO user_point_summary (user_id, total_earned, total_used) VALUES ($1, $2, 0) ON CONFLICT (user_id) DO UPDATE SET total_earned = user_point_summary.total_earned + $2, updated_at = NOW()',
    [userId, bonus]
  )
  
  ctx.body = success({
    streakDays: newStreak,
    bonusStars: bonus,
    totalStars: bonus
  })
})

export default router
