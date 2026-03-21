import Router from '@koa/router'
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

const router = new Router({ prefix: '/api/streak' })

router.get('/:childId', async (ctx) => {
  const { childId } = ctx.params
  
  try {
    const result = await pool.query(
      'SELECT current_streak, longest_streak, last_checkin_date FROM users WHERE id = $1',
      [childId]
    )
    
    if (result.rows.length === 0) {
      ctx.body = error(404, '用户不存在')
      return
    }
    
    const user = result.rows[0]
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    
    const checkedInToday = user.last_checkin_date === today
    const checkedInYesterday = user.last_checkin_date === yesterday
    
    ctx.body = success({
      currentStreak: user.current_streak || 0,
      longestStreak: user.longest_streak || 0,
      checkedInToday,
      lastCheckinDate: user.last_checkin_date
    })
  } catch (err) {
    console.error('Get streak error:', err)
    ctx.body = error(500, '获取打卡信息失败')
  }
})

router.post('/checkin/:childId', async (ctx) => {
  const { childId } = ctx.params
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    const userResult = await client.query(
      'SELECT current_streak, longest_streak, last_checkin_date FROM users WHERE id = $1',
      [childId]
    )
    
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK')
      ctx.body = error(404, '用户不存在')
      return
    }
    
    const user = userResult.rows[0]
    
    if (user.last_checkin_date === today) {
      await client.query('ROLLBACK')
      ctx.body = error(400, '今日已打卡')
      return
    }
    
    let newStreak = 1
    if (user.last_checkin_date === yesterday) {
      newStreak = (user.current_streak || 0) + 1
    }
    
    const newLongest = Math.max(newStreak, user.longest_streak || 0)
    
    await client.query(
      'UPDATE users SET current_streak = $1, longest_streak = $2, last_checkin_date = $3 WHERE id = $4',
      [newStreak, newLongest, today, childId]
    )
    
    await client.query('COMMIT')
    
    const newAchievements = []
    if (newStreak === 3) newAchievements.push({ id: 'streak_3', name: '坚持3天', emoji: '🔥' })
    if (newStreak === 7) newAchievements.push({ id: 'streak_7', name: '坚持一周', emoji: '🌟' })
    if (newStreak === 30) newAchievements.push({ id: 'streak_30', name: '月度达人', emoji: '🏆' })
    
    ctx.body = success({
      currentStreak: newStreak,
      longestStreak: newLongest,
      checkedInToday: true,
      newAchievements
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Checkin error:', err)
    ctx.body = error(500, '打卡失败')
  } finally {
    client.release()
  }
})

export default router
