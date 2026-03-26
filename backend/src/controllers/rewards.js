import pool from '../config/database.js'
import { addPoints, PointType } from '../services/points.js'

// 获取当前周的标识符 (如 2026-W13)
function getCurrentWeekIdentifier() {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  return `${year}-W${String(weekNumber).padStart(2, '0')}`
}

// 获取本周奖池的贴纸
export async function getWeeklyPoolStickers() {
  const currentWeek = getCurrentWeekIdentifier()
  
  // 查询本周限定贴纸（返回完整字段）
  const limitedResult = await pool.query(
    `SELECT id, name, emoji, rarity, description FROM stickers 
     WHERE (pool_type = 'limited' AND week_identifier = $1 AND is_active = true)
     OR pool_type = 'both'`,
    [currentWeek]
  )
  
  // 如果有限定贴纸，使用通用+限定混合池
  if (limitedResult.rows.length > 0) {
    const generalResult = await pool.query(
      `SELECT id, name, emoji, rarity, description FROM stickers 
       WHERE pool_type = 'general' AND is_active = true
       UNION ALL
       SELECT id, name, emoji, rarity, description FROM stickers 
       WHERE pool_type = 'both' AND is_active = true`,
      []
    )
    const allStickers = [...limitedResult.rows, ...generalResult.rows]
    return allStickers
  }
  
  // 否则只用通用池
  const result = await pool.query(
    `SELECT id, name, emoji, rarity, description FROM stickers 
     WHERE pool_type = 'general' AND is_active = true`,
    []
  )
  return result.rows
}

export async function awardRandomSticker(userId, taskType) {
  try {
    let probabilities = { N: 0.7, R: 0.2, SR: 0.08, SSR: 0.02 }
  if (taskType === 'weekly') {
    probabilities = { N: 0.5, R: 0.3, SR: 0.15, SSR: 0.05 }
  } else if (taskType === 'once') {
    probabilities = { N: 0.3, R: 0.3, SR: 0.25, SSR: 0.15 }
  }
  
  // 获取本周奖池
  const poolStickers = await getWeeklyPoolStickers()
  
  if (poolStickers.length === 0) {
    return { awarded: false, reason: 'no_stickers_in_pool' }
  }
  
  // 按稀有度分组
  const stickersByRarity = { N: [], R: [], SR: [], SSR: [] }
  for (const sticker of poolStickers) {
    if (stickersByRarity[sticker.rarity]) {
      stickersByRarity[sticker.rarity].push(sticker)
    }
  }
  
  // 根据概率选择稀有度
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
  
  // 从对应稀有度中随机选择
  const availableStickers = stickersByRarity[selectedRarity]
  if (availableStickers.length === 0) {
    // 如果没有该稀有度，向下兼容
    for (const rarity of ['SR', 'R', 'N']) {
      if (stickersByRarity[rarity].length > 0) {
        selectedRarity = rarity
        availableStickers = stickersByRarity[rarity]
        break
      }
    }
  }
  
  if (availableStickers.length === 0) {
    return { awarded: false, reason: 'no_stickers_available' }
  }
  
  const selectedSticker = availableStickers[Math.floor(Math.random() * availableStickers.length)]
  
  // 检查用户是否已有该贴纸
  const existing = await pool.query(
    'SELECT id FROM user_stickers WHERE user_id = $1 AND sticker_id = $2',
    [userId, selectedSticker.id]
  )
  if (existing.rows.length === 0) {
    await pool.query(
      'INSERT INTO user_stickers (user_id, sticker_id) VALUES ($1, $2)',
      [userId, selectedSticker.id]
    )
    return { awarded: true, stickerId: selectedSticker.id, rarity: selectedRarity }
  }
  return { awarded: false, reason: 'already_owned' }
  } catch (error) {
    console.error('awardRandomSticker error:', error)
    return { awarded: false, error: error.message }
  }
}

// 获取本周限定贴纸信息
export async function getWeeklyLimitedStickers() {
  const currentWeek = getCurrentWeekIdentifier()
  const result = await pool.query(
    `SELECT id, name, emoji, rarity, description, week_identifier 
     FROM stickers 
     WHERE pool_type = 'limited' AND week_identifier = $1 AND is_active = true
     ORDER BY rarity DESC`,
    [currentWeek]
  )
  return result.rows
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
  
  // 检查早鸟和夜猫子（使用 created_at 时间戳）
  const earlyBirdResult = await pool.query(`
    SELECT COUNT(*) as cnt FROM task_logs
    WHERE user_id = $1 AND action = 'complete'
    AND EXTRACT(HOUR FROM created_at) < 8
  `, [userId])
  const hasEarlyBird = parseInt(earlyBirdResult.rows[0]?.cnt || 0) > 0
  
  const nightOwlResult = await pool.query(`
    SELECT COUNT(*) as cnt FROM task_logs
    WHERE user_id = $1 AND action = 'complete'
    AND EXTRACT(HOUR FROM created_at) >= 22
  `, [userId])
  const hasNightOwl = parseInt(nightOwlResult.rows[0]?.cnt || 0) > 0
  
  // 早起成就（6点前、7点前）
  const early6Result = await pool.query(`
    SELECT COUNT(*) as cnt FROM task_logs
    WHERE user_id = $1 AND action = 'complete'
    AND EXTRACT(HOUR FROM created_at) < 6
  `, [userId])
  const hasEarly6 = parseInt(early6Result.rows[0]?.cnt || 0) > 0
  
  const early7Result = await pool.query(`
    SELECT COUNT(*) as cnt FROM task_logs
    WHERE user_id = $1 AND action = 'complete'
    AND EXTRACT(HOUR FROM created_at) < 7
  `, [userId])
  const hasEarly7 = parseInt(early7Result.rows[0]?.cnt || 0) > 0
  
  // 深夜成就（21点后、23点后）
  const night21Result = await pool.query(`
    SELECT COUNT(*) as cnt FROM task_logs
    WHERE user_id = $1 AND action = 'complete'
    AND EXTRACT(HOUR FROM created_at) >= 21
  `, [userId])
  const hasNight21 = parseInt(night21Result.rows[0]?.cnt || 0) > 0
  
  const night23Result = await pool.query(`
    SELECT COUNT(*) as cnt FROM task_logs
    WHERE user_id = $1 AND action = 'complete'
    AND EXTRACT(HOUR FROM created_at) >= 23
  `, [userId])
  const hasNight23 = parseInt(night23Result.rows[0]?.cnt || 0) > 0
  
  // 速度成就：5分钟内、10分钟内完成任务
  const speed5Result = await pool.query(`
    SELECT COUNT(*) as cnt FROM task_logs tl
    JOIN tasks t ON tl.task_id = t.id
    WHERE tl.user_id = $1 AND tl.action = 'complete'
    AND EXTRACT(EPOCH FROM (tl.completed_date - t.created_at)) / 60 < 5
  `, [userId])
  const hasSpeed5 = parseInt(speed5Result.rows[0]?.cnt || 0) > 0
  
  const speed10Result = await pool.query(`
    SELECT COUNT(*) as cnt FROM task_logs tl
    JOIN tasks t ON tl.task_id = t.id
    WHERE tl.user_id = $1 AND tl.action = 'complete'
    AND EXTRACT(EPOCH FROM (tl.completed_date - t.created_at)) / 60 < 10
  `, [userId])
  const hasSpeed10 = parseInt(speed10Result.rows[0]?.cnt || 0) > 0
  
  // 完美一天：今天完成所有每日任务
  const perfectDayResult = await pool.query(`
    WITH daily_tasks AS (
      SELECT COUNT(*) as total FROM tasks 
      WHERE frequency = 'daily' AND is_active = true
    ),
    daily_completed AS (
      SELECT COUNT(*) as done FROM task_logs tl
      JOIN tasks t ON tl.task_id = t.id
      WHERE tl.user_id = $1 AND tl.action = 'complete' 
      AND t.frequency = 'daily'
      AND tl.completed_date >= CURRENT_DATE
    )
    SELECT 
      (SELECT total FROM daily_tasks) as total_daily,
      (SELECT done FROM daily_completed) as done_daily
  `, [userId])
  const perfectDay = perfectDayResult.rows[0]
  const hasPerfectDay = perfectDay && perfectDay.total_daily > 0 && perfectDay.done_daily >= perfectDay.total_daily
  
  // 完美一周：本周7天每天都有完成任务
  const perfectWeekResult = await pool.query(`
    SELECT COUNT(DISTINCT DATE(completed_date)) as days
    FROM task_logs
    WHERE user_id = $1 AND action = 'complete'
    AND completed_date >= date_trunc('week', CURRENT_DATE)
    AND completed_date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
  `, [userId])
  const hasPerfectWeek = parseInt(perfectWeekResult.rows[0]?.days || 0) >= 7
  
  // 全能选手：三种频率任务都完成过
  const allFreqResult = await pool.query(`
    SELECT COUNT(DISTINCT t.frequency) as freq_count
    FROM task_logs tl
    JOIN tasks t ON tl.task_id = t.id
    WHERE tl.user_id = $1 AND tl.action = 'complete'
    AND t.frequency IN ('daily', 'weekly', 'once')
  `, [userId])
  const hasAllFreq = parseInt(allFreqResult.rows[0]?.freq_count || 0) >= 3
  
  // 周末战士：周六和周日都完成任务
  const weekendResult = await pool.query(`
    SELECT 
      COUNT(DISTINCT CASE WHEN EXTRACT(DOW FROM completed_date) = 0 THEN completed_date END) as sundays,
      COUNT(DISTINCT CASE WHEN EXTRACT(DOW FROM completed_date) = 6 THEN completed_date END) as saturdays
    FROM task_logs
    WHERE user_id = $1 AND action = 'complete'
    AND completed_date >= CURRENT_DATE - INTERVAL '7 days'
  `, [userId])
  const hasWeekend = weekendResult.rows[0] && 
    parseInt(weekendResult.rows[0].sundays) > 0 && 
    parseInt(weekendResult.rows[0].saturdays) > 0
  
  // 周日战神：连续3个周日都完成任务
  const sundayWarriorResult = await pool.query(`
    WITH recent_sundays AS (
      SELECT DISTINCT DATE(completed_date) as sunday_date
      FROM task_logs
      WHERE user_id = $1 AND action = 'complete'
      AND EXTRACT(DOW FROM completed_date) = 0
      AND completed_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY sunday_date DESC
      LIMIT 5
    )
    SELECT COUNT(*) as consecutive_sundays FROM recent_sundays
    WHERE sunday_date >= (SELECT MAX(sunday_date) FROM recent_sundays) - INTERVAL '3 weeks'
  `, [userId])
  const hasSundayWarrior = parseInt(sundayWarriorResult.rows[0]?.consecutive_sundays || 0) >= 3
  
  // 单日爆发：单日10星、单日5任务
  const dayStarResult = await pool.query(`
    SELECT COALESCE(SUM(stars_earned), 0) as stars
    FROM task_logs
    WHERE user_id = $1 AND action = 'complete'
    AND completed_date >= CURRENT_DATE
  `, [userId])
  const hasDayStar10 = parseInt(dayStarResult.rows[0]?.stars || 0) >= 10
  
  const dayTaskResult = await pool.query(`
    SELECT COUNT(*) as cnt FROM task_logs
    WHERE user_id = $1 AND action = 'complete'
    AND completed_date >= CURRENT_DATE
  `, [userId])
  const hasDayTask5 = parseInt(dayTaskResult.rows[0]?.cnt || 0) >= 5
  
  // 首次成就
  const hasFirstTask = parseInt(stats.task_count) >= 1
  const hasFirstStar = parseInt(stats.total_stars) >= 1
  
  // 目标成就（查询目标表）
  const goalResult = await pool.query(`
    SELECT COUNT(*) as cnt FROM goals WHERE user_id = $1
  `, [userId])
  const hasFirstGoal = parseInt(goalResult.rows[0]?.cnt || 0) >= 1
  
  // 连续登录：30天、100天
  const hasMonthlyStreak = loginStreak >= 30
  const hasCenturyStreak = loginStreak >= 100
  
  // 家庭英雄：用户有家庭
  const familyHelperResult = await pool.query(`
    SELECT COUNT(*) as cnt FROM users WHERE id = $1 AND family_id IS NOT NULL
  `, [userId])
  const hasFamilyMember = parseInt(familyHelperResult.rows[0]?.cnt || 0) > 0
  
  // 家族荣耀：家庭累计100星
  const familyStarResult = await pool.query(`
    SELECT COALESCE(SUM(tl.stars_earned), 0) as family_stars
    FROM task_logs tl
    JOIN users u ON tl.user_id = u.id
    WHERE u.family_id = (SELECT family_id FROM users WHERE id = $1)
    AND tl.approval_status = 'approved'
  `, [userId])
  const hasFamilyStar100 = parseInt(familyStarResult.rows[0]?.family_stars || 0) >= 100
  
  // 绝地反击：中断后重新连续7天
  const comebackResult = await pool.query(`
    WITH streaks AS (
      SELECT task_date, 
             task_date - ROW_NUMBER() OVER (ORDER BY task_date DESC)::int as grp
      FROM (
        SELECT DISTINCT DATE(completed_date) as task_date
        FROM task_logs WHERE user_id = $1 AND action = 'complete'
      ) dates
    )
    SELECT MAX(streak_len) as max_streak FROM (
      SELECT grp, COUNT(*) as streak_len FROM streaks GROUP BY grp
    ) sub
  `, [userId])
  const hasComeback = parseInt(comebackResult.rows[0]?.max_streak || 0) >= 7
  
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
    // 速度成就
    else if (type === 'speed_task_5' && hasSpeed5) shouldAward = true
    else if (type === 'speed_task_10' && hasSpeed10) shouldAward = true
    // 完美日/周
    else if (type === 'perfect_day' && hasPerfectDay) shouldAward = true
    else if (type === 'perfect_week' && hasPerfectWeek) shouldAward = true
    // 早起成就
    else if (type === 'early_6' && hasEarly6) shouldAward = true
    else if (type === 'early_7' && hasEarly7) shouldAward = true
    // 深夜成就
    else if (type === 'night_21' && hasNight21) shouldAward = true
    else if (type === 'night_23' && hasNight23) shouldAward = true
    // 全能/周末
    else if (type === 'all_frequency' && hasAllFreq) shouldAward = true
    else if (type === 'weekend_warrior' && hasWeekend) shouldAward = true
    else if (type === 'sunday_warrior' && hasSundayWarrior) shouldAward = true
    // 单日爆发
    else if (type === 'day_star_10' && hasDayStar10) shouldAward = true
    else if (type === 'day_task_5' && hasDayTask5) shouldAward = true
    // 首次成就
    else if (type === 'first_task' && hasFirstTask) shouldAward = true
    else if (type === 'first_star' && hasFirstStar) shouldAward = true
    else if (type === 'first_goal' && hasFirstGoal) shouldAward = true
    // 连续登录
    else if (type === 'monthly_streak' && hasMonthlyStreak) shouldAward = true
    else if (type === 'century_streak' && hasCenturyStreak) shouldAward = true
    // 家庭成就
    else if (type === 'family_helper' && hasFamilyMember) shouldAward = true
    else if (type === 'family_star_100' && hasFamilyStar100) shouldAward = true
    // 绝地反击
    else if (type === 'comeback' && hasComeback) shouldAward = true
    else if (type === 'never_give_up' && loginStreak >= 30) shouldAward = true
    
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
