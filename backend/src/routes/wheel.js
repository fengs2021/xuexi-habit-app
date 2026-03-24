import Router from '@koa/router'
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

const router = new Router({ prefix: '/api/wheel' })

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

router.post('/spin/:userId', async (ctx) => {
  const { userId } = ctx.params
  const today = new Date().toISOString().split('T')[0]
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    const existing = await client.query(
      'SELECT * FROM user_daily_spins WHERE user_id = $1 AND spin_date = $2',
      [userId, today]
    )
    
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK')
      ctx.body = error(400, '今日已转动转盘')
      return
    }
    
    const prizes = await client.query('SELECT * FROM spin_wheel_prizes')
    const prizeList = prizes.rows
    
    const totalWeight = prizeList.reduce((sum, p) => sum + p.weight, 0)
    let random = Math.random() * totalWeight
    let selectedPrize = prizeList[prizeList.length - 1]
    let cumulative = 0
    
    for (const prize of prizeList) {
      cumulative += prize.weight
      if (random <= cumulative) {
        selectedPrize = prize
        break
      }
    }
    
    await client.query(
      'INSERT INTO user_daily_spins (user_id, spin_date, prize_id, prize_name) VALUES ($1, $2, $3, $4)',
      [userId, today, selectedPrize.id, selectedPrize.name]
    )
    
    let rewardInfo = null
    if (selectedPrize.prize_type === 'stars' && selectedPrize.prize_value > 0) {
      await client.query(
        'UPDATE users SET stars = stars + $1 WHERE id = $2',
        [selectedPrize.prize_value, userId]
      )
      await client.query(
        'INSERT INTO user_point_summary (user_id, total_earned) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET total_earned = user_point_summary.total_earned + $2, updated_at = NOW()',
        [userId, selectedPrize.prize_value]
      )
      rewardInfo = { type: 'stars', value: selectedPrize.prize_value }
    } else if (selectedPrize.prize_type.startsWith('sticker_')) {
      const rarity = selectedPrize.prize_type.replace('sticker_', '').toUpperCase()
      const stickerResult = await client.query(
        'SELECT id FROM stickers WHERE rarity = $1 ORDER BY RANDOM() LIMIT 1',
        [rarity]
      )
      if (stickerResult.rows.length > 0) {
        await client.query(
          'INSERT INTO user_stickers (user_id, sticker_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, stickerResult.rows[0].id]
        )
        rewardInfo = { type: 'sticker', rarity, stickerId: stickerResult.rows[0].id }
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
