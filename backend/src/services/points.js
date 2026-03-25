/**
 * 统一积分管理服务 v2.0
 * 
 * 设计原则：
 * 1. 单一数据源 - users.stars 作为权威余额
 * 2. 完整追溯 - point_logs 记录所有变动
 * 3. 事务保证 - 所有变更都在事务中完成
 * 4. 一致性验证 - 每次变更后验证
 */

import pool from '../config/database.js'

/**
 * 积分变动类型
 */
export const PointType = {
  // 获得
  SIGNIN: 'signin',           // 签到
  TASK_APPROVE: 'task_approve', // 任务审批通过
  ACHIEVEMENT: 'achievement',   // 成就奖励
  WHEEL: 'wheel',             // 转盘中奖
  LOTTERY: 'lottery',         // 贴纸抽奖
  REVERSE: 'reverse',         // 撤销返还
  
  // 消耗
  EXCHANGE: 'exchange',       // 兑换奖励
  DEDUCT: 'deduct',           // 惩罚扣分
  
  // 调整
  ADJUST: 'adjust'            // 手动调整
}

/**
 * 增加积分
 * @param {string} userId - 用户ID
 * @param {number} amount - 积分数量（正数）
 * @param {string} pointType - 积分类型
 * @param {object} options - 其他选项
 * @returns {Promise<object>}
 */
export async function addPoints(userId, amount, pointType, options = {}) {
  const { sourceId = null, description = '' } = options
  
  if (!userId || amount <= 0) {
    return { success: false, error: '无效的参数' }
  }
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // 1. 更新 users 表
    const userResult = await client.query(
      `UPDATE users 
       SET stars = stars + $1, 
           total_stars = total_stars + $1,
           version = version + 1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING stars`,
      [amount, userId]
    )
    
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return { success: false, error: '用户不存在' }
    }
    
    const newBalance = userResult.rows[0].stars
    
    // 2. 记录积分日志
    await client.query(
      `INSERT INTO point_logs 
       (user_id, amount, balance_after, type, source, source_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, amount, newBalance, pointType, pointType, sourceId, description]
    )
    
    // 3. 验证一致性（可选，调试时开启）
    // await verifyConsistency(client, userId)
    
    await client.query('COMMIT')
    
    return {
      success: true,
      balance: newBalance,
      earned: amount
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('addPoints error:', err)
    return { success: false, error: err.message }
  } finally {
    client.release()
  }
}

/**
 * 扣除积分
 * @param {string} userId - 用户ID
 * @param {number} amount - 积分数量（正数）
 * @param {string} pointType - 积分类型
 * @param {object} options - 其他选项
 * @returns {Promise<object>}
 */
export async function subtractPoints(userId, amount, pointType, options = {}) {
  const { sourceId = null, description = '', allowNegative = false } = options
  
  if (!userId || amount <= 0) {
    return { success: false, error: '无效的参数' }
  }
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // 1. 检查余额
    const checkResult = await client.query(
      'SELECT stars FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    )
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return { success: false, error: '用户不存在' }
    }
    
    const currentBalance = checkResult.rows[0].stars
    
    if (!allowNegative && currentBalance < amount) {
      await client.query('ROLLBACK')
      return { 
        success: false, 
        error: '余额不足',
        required: amount,
        available: currentBalance
      }
    }
    
    // 2. 更新 users 表（扣除用负数）
    const userResult = await client.query(
      `UPDATE users 
       SET stars = stars - $1,
           version = version + 1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING stars`,
      [amount, userId]
    )
    
    const newBalance = userResult.rows[0].stars
    
    // 3. 记录积分日志（消耗用负数）
    await client.query(
      `INSERT INTO point_logs 
       (user_id, amount, balance_after, type, source, source_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, -amount, newBalance, pointType, pointType, sourceId, description]
    )
    
    await client.query('COMMIT')
    
    return {
      success: true,
      balance: newBalance,
      spent: amount
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('subtractPoints error:', err)
    return { success: false, error: err.message }
  } finally {
    client.release()
  }
}

/**
 * 获取用户积分信息
 * @param {string} userId - 用户ID
 * @returns {Promise<object>}
 */
export async function getPointsInfo(userId) {
  try {
    // 从 users 获取当前余额
    const userResult = await pool.query(
      'SELECT stars, total_stars FROM users WHERE id = $1',
      [userId]
    )
    
    if (userResult.rows.length === 0) {
      return { success: false, error: '用户不存在' }
    }
    
    const user = userResult.rows[0]
    
    // 从 point_logs 计算详细统计
    const statsResult = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_earned,
         COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_spent,
         COUNT(CASE WHEN amount > 0 THEN 1 END) as earn_count,
         COUNT(CASE WHEN amount < 0 THEN 1 END) as spend_count
       FROM point_logs WHERE user_id = $1`,
      [userId]
    )
    
    const stats = statsResult.rows[0]
    
    // 验证一致性
    const calculatedBalance = stats.total_earned - stats.total_spent
    const isConsistent = calculatedBalance === user.stars
    
    return {
      success: true,
      balance: user.stars,
      totalEarned: user.total_stars,
      totalSpent: stats.total_spent,
      earnCount: parseInt(stats.earn_count),
      spendCount: parseInt(stats.spend_count),
      isConsistent,
      difference: user.stars - calculatedBalance
    }
  } catch (err) {
    console.error('getPointsInfo error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * 获取积分变动历史
 * @param {string} userId - 用户ID
 * @param {object} options - 查询选项
 * @returns {Promise<object>}
 */
export async function getPointsHistory(userId, options = {}) {
  const { limit = 50, offset = 0, type = null } = options
  
  try {
    let whereClause = 'WHERE user_id = $1'
    const params = [userId]
    
    if (type) {
      whereClause += ' AND type = $2'
      params.push(type)
    }
    
    params.push(limit, offset)
    
    const result = await pool.query(
      `SELECT * FROM point_logs 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.indexOf(limit) + 1} OFFSET $${params.indexOf(offset) + 1}`,
      params
    )
    
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM point_logs ${whereClause}`,
      type ? [userId, type] : [userId]
    )
    
    return {
      success: true,
      items: result.rows,
      total: parseInt(countResult.rows[0].total),
      hasMore: offset + result.rows.length < parseInt(countResult.rows[0].total)
    }
  } catch (err) {
    console.error('getPointsHistory error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * 修复用户积分一致性
 * @param {string} userId - 用户ID
 * @returns {Promise<object>}
 */
export async function fixPointsConsistency(userId) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // 计算 point_logs 中的总获得和总消耗
    const statsResult = await client.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_earned,
         COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_spent
       FROM point_logs WHERE user_id = $1`,
      [userId]
    )
    
    const stats = statsResult.rows[0]
    const calculatedBalance = stats.total_earned - stats.total_spent
    
    // 修复 users 表
    await client.query(
      `UPDATE users 
       SET stars = $1,
           total_stars = $2,
           version = version + 1
       WHERE id = $3`,
      [calculatedBalance, stats.total_earned, userId]
    )
    
    await client.query('COMMIT')
    
    return {
      success: true,
      oldBalance: null, // 不知道原来的值
      newBalance: calculatedBalance,
      totalEarned: stats.total_earned,
      totalSpent: stats.total_spent
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('fixPointsConsistency error:', err)
    return { success: false, error: err.message }
  } finally {
    client.release()
  }
}

/**
 * 批量修复所有用户的积分一致性
 * @returns {Promise<object>}
 */
export async function fixAllPointsConsistency() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // 找出所有不一致的用户
    const inconsistentUsers = await client.query(
      `SELECT u.id, u.nickname, u.stars, u.total_stars,
              COALESCE(ps.total_earned, 0) as logged_earned,
              COALESCE(ps.total_used, 0) as logged_used
       FROM users u
       LEFT JOIN user_point_summary ps ON u.id = ps.user_id
       WHERE u.role = 'child' 
         AND (u.stars < 0 OR u.total_stars < 0)`
    )
    
    const results = []
    
    for (const user of inconsistentUsers.rows) {
      // 计算正确的余额
      const statsResult = await client.query(
        `SELECT 
           COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_earned,
           COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_spent
         FROM point_logs WHERE user_id = $1`,
        [user.id]
      )
      
      const stats = statsResult.rows[0]
      const newBalance = stats.total_earned - stats.total_spent
      
      await client.query(
        `UPDATE users SET stars = $1, total_stars = $2 WHERE id = $3`,
        [newBalance, stats.total_earned, user.id]
      )
      
      results.push({
        userId: user.id,
        nickname: user.nickname,
        oldBalance: user.stars,
        newBalance
      })
    }
    
    await client.query('COMMIT')
    
    return {
      success: true,
      fixed: results.length,
      details: results
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('fixAllPointsConsistency error:', err)
    return { success: false, error: err.message }
  } finally {
    client.release()
  }
}

export default {
  PointType,
  addPoints,
  subtractPoints,
  getPointsInfo,
  getPointsHistory,
  fixPointsConsistency,
  fixAllPointsConsistency
}
