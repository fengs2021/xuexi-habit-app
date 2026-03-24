import Router from '@koa/router'
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import { addPoints, PointType } from '../services/points.js'

const router = new Router({ prefix: '/api/wheel' })

// 获取转盘配置
router.get('/config', async (ctx) => {
  try {
    const result = await pool.query('SELECT * FROM spin_wheel_prizes ORDER BY id')
    ctx.body = success(result.rows.map(p => ({
      id: p.id,
      name: p.name,
      type: p.prize_type,
      value: p.prize_value,
      emoji: p.emoji,
      weight: p.weight
    })))
  } catch (err) {
    console.error('Get wheel config error:', err)
    ctx.body = error(500, '获取转盘配置失败')
  }
})

// 检查今日是否已转动
router.get('/today/:userId', async (ctx) => {
  const { userId } = ctx.params
  const today = new Date().toISOString().split('T')[0]
  
  try {
    const result = await pool.query(
      'SELECT * FROM user_daily_spins WHERE user_id = $1 AND spin_date = $2',
      [userId, today]
    )
    ctx.body = success({
      spun: result.rows.length > 0,
      spinRecord: result.rows[0] || null
    })
  } catch (err) {
    console.error('Check today spin error:', err)
    ctx.body = error(500, '检查失败')
  }
})

// 转动转盘
router.post('/spin/:userId', async (ctx) => {
  const { userId } = ctx.params
  const today = new Date().toISOString().split('T')[0]
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // 检查今日是否已转动
    const existing = await client.query(
      'SELECT * FROM user_daily_spins WHERE user_id = $1 AND spin_date = $2',
      [userId, today]
    )
    
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK')
      ctx.body = error(400, '今日已转动转盘')
      return
    }
    
    // 获取奖品列表
    const prizes = await client.query('SELECT * FROM spin_wheel_prizes')
    const prizeList = prizes.rows
    
    // 计算中奖结果（加权随机）
    const totalWeight = prizeList.reduce((sum, p) => sum + p.weight, 0)
    let random = Math.random() * totalWeight
    let selectedPrize = prizeList[prizeList.length - 1]
    let cumulative = 0
    
    for (const prize of prizeList) {
      cumulative += prize.weight
      if (random < cumulative) {
        selectedPrize = prize
        break
      }
    }
    
    // 记录转动
    await client.query(
      'INSERT INTO user_daily_spins (user_id, spin_date, prize_id, prize_name) VALUES ($1, $2, $3, $4)',
      [userId, today, selectedPrize.id, selectedPrize.name]
    )
    
    let rewardInfo = null
    
    // 处理奖励
    if (selectedPrize.prize_type === 'stars' && selectedPrize.prize_value > 0) {
      // 使用统一积分服务发放星星
      const pointsResult = await addPoints(userId, selectedPrize.prize_value, PointType.WHEEL, {
        sourceId: selectedPrize.id,
        description: `转盘中奖获得 ${selectedPrize.prize_value} 星星`
      })
      rewardInfo = { type: 'stars', value: selectedPrize.prize_value }
      
    } else if (selectedPrize.prize_type === 'sticker') {
      // 转盘奖励贴纸，随机发放一张N/R级别的贴纸
      const stickerResult = await client.query(
        `SELECT id, rarity FROM stickers WHERE rarity IN ('N', 'R') ORDER BY RANDOM() LIMIT 1`
      )
      if (stickerResult.rows.length > 0) {
        await client.query(
          'INSERT INTO user_stickers (user_id, sticker_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, stickerResult.rows[0].id]
        )
        rewardInfo = { 
          type: 'sticker', 
          rarity: stickerResult.rows[0].rarity, 
          stickerId: stickerResult.rows[0].id 
        }
      }
    }
    
    await client.query('COMMIT')
    
    ctx.body = success({
      prize: {
        id: selectedPrize.id,
        name: selectedPrize.name,
        emoji: selectedPrize.emoji,
        type: selectedPrize.prize_type
      },
      reward: rewardInfo
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Spin error:', err)
    ctx.body = error(500, '转动失败')
  } finally {
    client.release()
  }
})

export default router
