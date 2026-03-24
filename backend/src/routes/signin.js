import Router from 'koa-router'
import pool from '../config/database.js'
import { success } from '../utils/response.js'
import { addPoints, PointType, getPointsInfo } from '../services/points.js'

const router = new Router({ prefix: '/api/signin' })

// 签到奖励规则：1,1,2,2,2,3,5（七天循环）
const SIGNIN_REWARDS = [1, 1, 2, 2, 2, 3, 5]

// 获取今日签到信息
router.get('/info/:userId', async (ctx) => {
  const { userId } = ctx.params
  
  try {
    // 获取用户最后签到记录
    const lastSignResult = await pool.query(
      'SELECT sign_date, streak_days, bonus_stars FROM user_signins WHERE user_id = $1 ORDER BY sign_date DESC LIMIT 1',
      [userId]
    )
    
    // 获取积分信息
    const pointsInfo = await getPointsInfo(userId)
    
    const today = new Date().toISOString().split('T')[0]
    let checkedIn = false
    let streakDays = 0
    let todayBonus = 0
    let canClaim = true
    
    if (lastSignResult.rows.length > 0) {
      const lastSign = lastSignResult.rows[0]
      const lastSignDate = new Date(lastSign.sign_date).toISOString().split('T')[0]
      streakDays = lastSign.streak_days || 0
      
      // 检查今天是否已签到
      if (lastSignDate === today) {
        checkedIn = true
        canClaim = false
        todayBonus = lastSign.bonus_stars || 0
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
      monthDays,
      currentStars: pointsInfo.success ? pointsInfo.balance : 0
    })
  } catch (err) {
    console.error('Get signin info error:', err)
    ctx.body = success({
      checkedIn: false,
      streakDays: 0,
      todayBonus: 1,
      canClaim: true,
      monthDays: [],
      currentStars: 0
    })
  }
})

// 执行签到（统一签到入口，同时处理连续天数）
router.post('/checkin', async (ctx) => {
  const { userId } = ctx.request.body
  
  if (!userId) {
    ctx.status = 400
    ctx.body = { code: 400, message: '缺少userId' }
    return
  }
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    
    // 检查今天是否已签到
    const existing = await client.query(
      'SELECT id, streak_days FROM user_signins WHERE user_id = $1 AND sign_date = $2',
      [userId, today]
    )
    
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK')
      ctx.body = success({ alreadySignedIn: true, message: '今天已签到' })
      return
    }
    
    // 获取昨天签到记录
    const lastSignResult = await client.query(
      'SELECT sign_date, streak_days FROM user_signins WHERE user_id = $1 ORDER BY sign_date DESC LIMIT 1',
      [userId]
    )
    
    // 计算新的连续天数
    let newStreak = 1
    if (lastSignResult.rows.length > 0) {
      const lastSign = lastSignResult.rows[0]
      const lastSignDate = new Date(lastSign.sign_date).toISOString().split('T')[0]
      
      if (lastSignDate === yesterday) {
        newStreak = (lastSign.streak_days || 0) + 1
      }
    }
    
    // 计算奖励
    const bonus = SIGNIN_REWARDS[(newStreak - 1) % 7]
    
    // 插入签到记录
    await client.query(
      `INSERT INTO user_signins (user_id, sign_date, streak_days, bonus_stars, current_streak, longest_streak) 
       VALUES ($1, $2, $3, $4, $3, $3)
       ON CONFLICT (user_id, sign_date) DO NOTHING`,
      [userId, today, newStreak, bonus]
    )
    
    // 使用统一的积分服务增加星星
    const pointsResult = await addPoints(userId, bonus, PointType.SIGNIN, {
      description: `签到获得 ${bonus} 星星（连续${newStreak}天）`
    })
    
    // 更新宠物亲密度（如果有）
    try {
      await client.query(
        'UPDATE user_pets SET intimacy = intimacy + 1, updated_at = NOW() WHERE user_id = $1',
        [userId]
      )
    } catch (e) {
      // ignore if no pet
    }
    
    await client.query('COMMIT')
    
    ctx.body = success({
      streakDays: newStreak,
      bonusStars: bonus,
      totalStars: pointsResult.success ? pointsResult.balance : 0
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Signin error:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: '签到失败' }
  } finally {
    client.release()
  }
})

// 获取历史签到记录
router.get('/history/:userId', async (ctx) => {
  const { userId } = ctx.params
  const { limit = 30 } = ctx.query
  
  try {
    const result = await pool.query(
      'SELECT sign_date, streak_days, bonus_stars FROM user_signins WHERE user_id = $1 ORDER BY sign_date DESC LIMIT $2',
      [userId, parseInt(limit)]
    )
    ctx.body = success(result.rows)
  } catch (err) {
    ctx.body = { code: 500, message: '获取历史失败' }
  }
})

// 获取签到统计
router.get('/stats/:userId', async (ctx) => {
  const { userId } = ctx.params
  
  try {
    // 获取本月签到天数
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthResult = await pool.query(
      'SELECT COUNT(*) as days FROM user_signins WHERE user_id = $1 AND sign_date >= $2',
      [userId, monthStart]
    )
    
    // 获取最长连续
    const maxStreakResult = await pool.query(
      'SELECT MAX(streak_days) as longest FROM user_signins WHERE user_id = $1',
      [userId]
    )
    
    // 获取积分信息
    const pointsInfo = await getPointsInfo(userId)
    
    ctx.body = success({
      monthDays: parseInt(monthResult.rows[0]?.days) || 0,
      longestStreak: parseInt(maxStreakResult.rows[0]?.longest) || 0,
      totalEarned: pointsInfo.success ? pointsInfo.totalEarned : 0,
      totalSpent: pointsInfo.success ? pointsInfo.totalSpent : 0,
      currentBalance: pointsInfo.success ? pointsInfo.balance : 0
    })
  } catch (err) {
    ctx.body = { code: 500, message: '获取统计失败' }
  }
})

export default router
