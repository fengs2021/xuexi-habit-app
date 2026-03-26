import pool from '../config/database.js'

/**
 * 积分管理工具
 * 统一管理用户星星的增减和查询
 */

/**
 * 增加用户星星
 * @param {string} userId - 用户ID
 * @param {number} amount - 增加数量（正数）
 * @param {string} reason - 原因（用于记录）
 * @returns {Promise<{success: boolean, stars: number, totalEarned: number}>}
 */
export async function addStars(userId, amount, reason = 'earn') {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // 更新 users 表
    const userResult = await client.query(
      'UPDATE users SET stars = stars + $1, total_stars = total_stars + $1 WHERE id = $2 RETURNING stars, total_stars',
      [amount, userId]
    )
    
    // 更新积分汇总表
    await client.query(
      `INSERT INTO user_point_summary (user_id, total_earned, total_used) 
       VALUES ($1, $2, 0) 
       ON CONFLICT (user_id) DO UPDATE SET 
         total_earned = user_point_summary.total_earned + $2,
         updated_at = NOW()`,
      [userId, amount]
    )
    
    // 记录积分变动日志
    await client.query(
      `INSERT INTO point_logs (user_id, amount, balance, type, reason, created_at)
       VALUES ($1, $2, $3, 'earn', $4, NOW())`,
      [userId, amount, userResult.rows[0]?.stars || 0, reason]
    )
    
    await client.query('COMMIT')
    
    return {
      success: true,
      stars: userResult.rows[0]?.stars || 0,
      totalEarned: userResult.rows[0]?.total_stars || 0
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('addStars error:', err)
    throw err
  } finally {
    client.release()
  }
}

/**
 * 扣除用户星星
 * @param {string} userId - 用户ID
 * @param {number} amount - 扣除数量（正数）
 * @param {string} reason - 原因
 * @returns {Promise<{success: boolean, stars: number, totalUsed: number}>}
 */
export async function subtractStars(userId, amount, reason = 'spend') {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // 检查余额是否充足
    const checkResult = await client.query('SELECT stars FROM users WHERE id = $1', [userId])
    const currentStars = checkResult.rows[0]?.stars || 0
    
    if (currentStars < amount) {
      await client.query('ROLLBACK')
      return { success: false, error: '余额不足', stars: currentStars }
    }
    
    // 更新 users 表
    const userResult = await client.query(
      'UPDATE users SET stars = stars - $1 WHERE id = $2 RETURNING stars',
      [amount, userId]
    )
    
    // 更新积分汇总表
    await client.query(
      `INSERT INTO user_point_summary (user_id, total_earned, total_used) 
       VALUES ($1, 0, $2) 
       ON CONFLICT (user_id) DO UPDATE SET 
         total_used = user_point_summary.total_used + $2,
         updated_at = NOW()`,
      [userId, amount]
    )
    
    // 记录积分变动日志
    await client.query(
      `INSERT INTO point_logs (user_id, amount, balance, type, reason, created_at)
       VALUES ($1, $2, $3, 'spend', $4, NOW())`,
      [userId, -amount, userResult.rows[0]?.stars || 0, reason]
    )
    
    await client.query('COMMIT')
    
    return {
      success: true,
      stars: userResult.rows[0]?.stars || 0,
      totalUsed: amount
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('subtractStars error:', err)
    throw err
  } finally {
    client.release()
  }
}

/**
 * 获取用户当前星星（从数据库实时获取）
 * @param {string} userId - 用户ID
 * @returns {Promise<{stars: number, totalEarned: number, totalUsed: number}>}
 */
export async function getUserStars(userId) {
  try {
    // 从 users 表获取
    const userResult = await pool.query(
      'SELECT stars, total_stars FROM users WHERE id = $1',
      [userId]
    )
    
    // 从 point_summary 获取
    const summaryResult = await pool.query(
      'SELECT total_earned, total_used FROM user_point_summary WHERE user_id = $1',
      [userId]
    )
    
    const user = userResult.rows[0] || { stars: 0, total_stars: 0 }
    const summary = summaryResult.rows[0] || { total_earned: 0, total_used: 0 }
    
    return {
      stars: user.stars || 0,
      totalEarned: user.total_stars || 0,
      totalUsed: summary.total_used || 0,
      // 可验证：stars + total_used 应该等于 total_earned
      verified: (user.stars || 0) + (summary.total_used || 0) === (user.total_stars || 0)
    }
  } catch (err) {
    console.error('getUserStars error:', err)
    return { stars: 0, totalEarned: 0, totalUsed: 0, error: err.message }
  }
}

export default { addStars, subtractStars, getUserStars }
