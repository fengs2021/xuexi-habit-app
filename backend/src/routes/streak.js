import Router from 'koa-router'
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

const router = new Router({ prefix: '/api/streak' })

// 获取用户连续打卡信息（只读，数据来源于签到系统）
router.get('/:childId', async (ctx) => {
  const { childId } = ctx.params
  
  try {
    // 获取今日签到状态
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    
    // 获取最新签到记录
    const lastSignResult = await pool.query(
      'SELECT sign_date, streak_days, bonus_stars FROM user_signins WHERE user_id = $1 ORDER BY sign_date DESC LIMIT 1',
      [childId]
    )
    
    // 获取最长连续记录
    const maxStreakResult = await pool.query(
      'SELECT MAX(streak_days) as longest_streak FROM user_signins WHERE user_id = $1',
      [childId]
    )
    
    const lastSign = lastSignResult.rows[0]
    
    // 判断是否今天已签到
    const checkedInToday = lastSign && new Date(lastSign.sign_date).toISOString().split('T')[0] === today
    
    // 计算当前连续天数（如果中断了则返回0）
    let currentStreak = 0
    if (lastSign) {
      const lastSignDate = new Date(lastSign.sign_date).toISOString().split('T')[0]
      if (lastSignDate === today || lastSignDate === yesterday) {
        currentStreak = lastSign.streak_days || 0
      }
    }
    
    ctx.body = success({
      currentStreak,
      longestStreak: parseInt(maxStreakResult.rows[0]?.longest_streak) || 0,
      checkedInToday,
      lastCheckinDate: lastSign ? lastSign.sign_date : null,
      todayBonus: checkedInToday ? (lastSign?.bonus_stars || 0) : 0
    })
  } catch (err) {
    console.error('Get streak error:', err)
    ctx.body = error(500, '获取打卡信息失败')
  }
})

// 获取连续打卡成就进度
router.get('/:childId/achievements', async (ctx) => {
  const { childId } = ctx.params
  
  try {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    
    // 获取最新签到记录
    const lastSignResult = await pool.query(
      'SELECT streak_days FROM user_signins WHERE user_id = $1 ORDER BY sign_date DESC LIMIT 1',
      [childId]
    )
    
    const lastSign = lastSignResult.rows[0]
    let currentStreak = 0
    if (lastSign) {
      const lastSignDate = new Date(lastSign.sign_date).toISOString().split('T')[0]
      if (lastSignDate === today || lastSignDate === yesterday) {
        currentStreak = lastSign.streak_days || 0
      }
    }
    
    // 计算各成就进度
    const achievements = [
      { id: 'streak_3', name: '坚持3天', emoji: '🔥', target: 3, current: Math.min(currentStreak, 3) },
      { id: 'streak_7', name: '坚持一周', emoji: '🌟', target: 7, current: Math.min(currentStreak, 7) },
      { id: 'streak_30', name: '月度达人', emoji: '🏆', target: 30, current: Math.min(currentStreak, 30) }
    ]
    
    ctx.body = success(achievements)
  } catch (err) {
    ctx.body = error(500, '获取成就进度失败')
  }
})

export default router
