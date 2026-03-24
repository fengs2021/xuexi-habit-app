import pool from '../config/database.js'
import { addPoints, PointType } from '../services/points.js'

export async function awardRandomSticker(userId, taskType) {
  try {
    let probabilities = { N: 0.7, R: 0.2, SR: 0.08, SSR: 0.02 }
  if (taskType === 'weekly') {
    probabilities = { N: 0.5, R: 0.3, SR: 0.15, SSR: 0.05 }
  } else if (taskType === 'once') {
    probabilities = { N: 0.3, R: 0.3, SR: 0.25, SSR: 0.15 }
  }
  
  const rand = Math.random()
  let cumulative = 0
  let selectedRarity = 'N'
  for (const [rarity, prob] of Object.entries(probabilities)) {
    cumulative += prob
    if (rand <= cumulative) {
      selectedRarity = rarity
      break
    }
  }
  
  const stickerResult = await pool.query(
    'SELECT id FROM stickers WHERE rarity = $1 ORDER BY RANDOM() LIMIT 1',
    [selectedRarity]
  )
  
  if (stickerResult.rows.length > 0) {
    const stickerId = stickerResult.rows[0].id
    const existing = await pool.query(
      'SELECT id FROM user_stickers WHERE user_id = $1 AND sticker_id = $2',
      [userId, stickerId]
    )
    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO user_stickers (user_id, sticker_id) VALUES ($1, $2)',
        [userId, stickerId]
      )
      return { awarded: true, stickerId, rarity: selectedRarity }
    }
  }
  return { awarded: false }
  } catch (error) {
    console.error('awardRandomSticker error:', error)
    return { awarded: false, error: error.message }
  }
}

export async function checkAndAwardAchievements(userId) {
  const awarded = []
  try {
  
  const earnedResult = await pool.query(
    'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
    [userId]
  )
  const earnedIds = earnedResult.rows.map(r => r.achievement_id)
  
  const statsResult = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM task_logs WHERE user_id = $1 AND action = 'complete') as task_count,
      (SELECT COALESCE(SUM(stars_earned), 0) FROM task_logs WHERE user_id = $1 AND approval_status = 'approved') as total_stars,
      (SELECT COUNT(*) FROM user_stickers WHERE user_id = $1) as sticker_count,
      (SELECT COUNT(*) FROM exchange_logs WHERE user_id = $1 AND status = 'completed') as exchange_count,
      (SELECT COUNT(*) FROM task_logs WHERE user_id = $1 AND action = 'complete' AND task_type = 'special') as special_task_count
  `, [userId])
  const stats = statsResult.rows[0]
  
  // 计算每个任务的连续完成天数
  const taskStreaksResult = await pool.query(`
    WITH task_days AS (
      SELECT task_id, DATE(completed_date) as task_date
      FROM task_logs
      WHERE user_id = $1 AND action = 'complete' AND completed_date IS NOT NULL
      GROUP BY task_id, DATE(completed_date)
    ),
    task_streaks AS (
      SELECT task_id, task_date, task_date - ROW_NUMBER() OVER (PARTITION BY task_id ORDER BY task_date DESC)::int as grp
      FROM task_days
    ),
    max_streaks AS (
      SELECT task_id, COUNT(*) as streak_days
      FROM task_streaks
      GROUP BY task_id, grp
    )
    SELECT MAX(streak_days) as max_streak FROM max_streaks
  `, [userId])
  const maxTaskStreak = parseInt(taskStreaksResult.rows[0]?.max_streak || 0)
  
  // 计算单个任务最高累计完成次数
  const taskCountResult = await pool.query(`
    SELECT task_id, COUNT(*) as cnt
    FROM task_logs
    WHERE user_id = $1 AND action = 'complete'
    GROUP BY task_id
    ORDER BY cnt DESC
    LIMIT 1
  `, [userId])
  const maxTaskCount = taskCountResult.rows.length > 0 ? parseInt(taskCountResult.rows[0].cnt) : 0
  
  // 计算连续登录天数
  const loginStreakResult = await pool.query(`
    WITH days AS (
      SELECT DISTINCT DATE(created_at) as login_date
      FROM task_logs
      WHERE user_id = $1
      ORDER BY login_date DESC
    ),
    streaks AS (
      SELECT login_date, login_date - (ROW_NUMBER() OVER (ORDER BY login_date DESC))::int as grp
      FROM days
    )
    SELECT COUNT(*) as streak_days FROM streaks
    WHERE grp = (SELECT grp FROM streaks LIMIT 1)
  `, [userId])
  const loginStreak = parseInt(loginStreakResult.rows[0]?.streak_days || 0)
  
  // 计算连续完成任务天数
  const taskStreakResult = await pool.query(`
    WITH days AS (
      SELECT DISTINCT DATE(completed_date) as task_date
      FROM task_logs
      WHERE user_id = $1 AND action = 'complete' AND completed_date IS NOT NULL
      ORDER BY task_date DESC
    ),
    streaks AS (
      SELECT task_date, task_date - (ROW_NUMBER() OVER (ORDER BY task_date DESC))::int as grp
      FROM days
    )
    SELECT COUNT(*) as streak_days FROM streaks
    WHERE grp = (SELECT grp FROM streaks LIMIT 1)
  `, [userId])
  const taskStreak = parseInt(taskStreakResult.rows[0]?.streak_days || 0)
  
  // 检查早鸟和夜猫子
  const earlyBirdResult = await pool.query(`
    SELECT COUNT(*) as cnt FROM task_logs
    WHERE user_id = $1 AND action = 'complete'
    AND EXTRACT(HOUR FROM completed_date) < 8
  `, [userId])
  const hasEarlyBird = parseInt(earlyBirdResult.rows[0]?.cnt || 0) > 0
  
  const nightOwlResult = await pool.query(`
    SELECT COUNT(*) as cnt FROM task_logs
    WHERE user_id = $1 AND action = 'complete'
    AND EXTRACT(HOUR FROM completed_date) >= 22
  `, [userId])
  const hasNightOwl = parseInt(nightOwlResult.rows[0]?.cnt || 0) > 0
  
  const achievementsResult = await pool.query('SELECT * FROM achievement_definitions')
  
  for (const achievement of achievementsResult.rows) {
    if (earnedIds.includes(achievement.id)) continue
    
    let shouldAward = false
    const type = achievement.type
    
    // 任务数量
    if (type === 'task_count_10' && parseInt(stats.task_count) >= 10) shouldAward = true
    else if (type === 'task_count_50' && parseInt(stats.task_count) >= 50) shouldAward = true
    else if (type === 'task_count_100' && parseInt(stats.task_count) >= 100) shouldAward = true
    // 星星累计
    else if (type === 'star_total_50' && parseInt(stats.total_stars) >= 50) shouldAward = true
    else if (type === 'star_total_200' && parseInt(stats.total_stars) >= 200) shouldAward = true
    // 贴纸收集
    else if (type === 'sticker_count_10' && parseInt(stats.sticker_count) >= 10) shouldAward = true
    else if (type === 'sticker_count_20' && parseInt(stats.sticker_count) >= 20) shouldAward = true
    else if (type === 'sticker_count_30' && parseInt(stats.sticker_count) >= 30) shouldAward = true
    // 连续登录
    else if (type === 'login_streak_3' && loginStreak >= 3) shouldAward = true
    else if (type === 'login_streak_7' && loginStreak >= 7) shouldAward = true
    // 连续任务
    else if (type === 'task_streak_3' && taskStreak >= 3) shouldAward = true
    else if (type === 'task_streak_7' && taskStreak >= 7) shouldAward = true
    // 兑换
    else if (type === 'exchange_count_1' && parseInt(stats.exchange_count) >= 1) shouldAward = true
    // 特殊任务
    else if (type === 'special_task_1' && parseInt(stats.special_task_count) >= 1) shouldAward = true
    // 早鸟/夜猫子
    else if (type === 'early_bird' && hasEarlyBird) shouldAward = true
    else if (type === 'night_owl' && hasNightOwl) shouldAward = true
    // 单项任务连续达成
    else if (type === 'streak_task_7' && maxTaskStreak >= 7) shouldAward = true
    else if (type === 'streak_task_15' && maxTaskStreak >= 15) shouldAward = true
    else if (type === 'streak_task_30' && maxTaskStreak >= 30) shouldAward = true
    else if (type === 'streak_task_60' && maxTaskStreak >= 60) shouldAward = true
    // 单项任务累计完成
    else if (type === 'count_task_10' && maxTaskCount >= 10) shouldAward = true
    else if (type === 'count_task_30' && maxTaskCount >= 30) shouldAward = true
    else if (type === 'count_task_60' && maxTaskCount >= 60) shouldAward = true
    else if (type === 'count_task_100' && maxTaskCount >= 100) shouldAward = true
    
    if (shouldAward) {
      await pool.query(
        'INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
        [userId, achievement.id]
      )
      
      // 发放成就奖励星星
      const rewardStars = achievement.reward_stars || 0
      if (rewardStars > 0) {
        await addPoints(userId, rewardStars, PointType.ACHIEVEMENT, {
          sourceId: achievement.id,
          description: `解锁成就「${achievement.name}」奖励 ${rewardStars} 星星`
        })
      }
      
      awarded.push(achievement)
    }
  }
  
  return awarded
  } catch (error) {
    console.error('checkAndAwardAchievements error:', error)
    return awarded
  }
}
