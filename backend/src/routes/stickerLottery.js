import Router from 'koa-router'
import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'
import { addPoints, subtractPoints, PointType } from '../services/points.js'
import { getWeeklyPoolStickers } from '../controllers/rewards.js'

const router = new Router({ prefix: '/api/sticker-lottery' })

const DRAW_COST = 5
const GUARANTEE_COUNT = 20

// 获取本周限定贴纸信息
router.get('/weekly-limited', async (ctx) => {
  try {
    const currentWeek = getCurrentWeekIdentifier()
    const weekStart = getWeekStartDate()
    const weekEnd = getWeekEndDate()
    
    const result = await pool.query(
      `SELECT id, name, emoji, rarity, description 
       FROM stickers 
       WHERE pool_type = 'limited' AND week_identifier = $1 AND is_active = true
       ORDER BY 
         CASE rarity WHEN 'SSR' THEN 1 WHEN 'SR' THEN 2 WHEN 'R' THEN 3 ELSE 4 END
       LIMIT 3`,
      [currentWeek]
    )
    
    ctx.body = success({
      weekIdentifier: currentWeek,
      weekStart,
      weekEnd,
      limitedStickers: result.rows
    })
  } catch (err) {
    console.error('Get weekly limited error:', err)
    ctx.body = success({ limitedStickers: [], weekStart: '', weekEnd: '' })
  }
})

// 获取用户抽奖进度
router.get('/progress/:userId', async (ctx) => {
  const { userId } = ctx.params
  
  try {
    // 检查是否需要重置（每周一重置）
    const progressResult = await pool.query(
      'SELECT * FROM sticker_lottery_progress WHERE user_id = $1',
      [userId]
    )
    
    let progress = progressResult.rows[0]
    const currentWeek = getCurrentWeekIdentifier()
    
    if (!progress) {
      // 创建新进度
      await pool.query(
        'INSERT INTO sticker_lottery_progress (user_id, draw_count, last_reset_at) VALUES ($1, 0, NOW())',
        [userId]
      )
      progress = { user_id: userId, draw_count: 0, guarantee_exchange_used: false }
    } else if (progress.last_reset_at && !isSameWeek(progress.last_reset_at, new Date())) {
      // 新的一周，重置进度
      await pool.query(
        'UPDATE sticker_lottery_progress SET draw_count = 0, last_reset_at = NOW(), guarantee_exchange_used = false WHERE user_id = $1',
        [userId]
      )
      progress.draw_count = 0
      progress.guarantee_exchange_used = false
    }
    
    ctx.body = success({
      drawCount: progress.draw_count || 0,
      guaranteeCount: GUARANTEE_COUNT,
      canGuaranteeExchange: (progress.draw_count || 0) >= GUARANTEE_COUNT && !progress.guarantee_exchange_used,
      guaranteeExchangeUsed: progress.guarantee_exchange_used
    })
  } catch (err) {
    console.error('Get progress error:', err)
    ctx.body = success({ drawCount: 0, guaranteeCount: GUARANTEE_COUNT, canGuaranteeExchange: false })
  }
})

// 执行抽奖
router.post('/draw/:userId', async (ctx) => {
  const { userId } = ctx.params
  
  try {
    // 检查积分
    const pointsResult = await pool.query(
      'SELECT stars FROM users WHERE id = $1',
      [userId]
    )
    const currentStars = pointsResult.rows[0]?.stars || 0
    
    if (currentStars < DRAW_COST) {
      ctx.body = error(ErrorCodes.PARAM_ERROR, `积分不够，需要${DRAW_COST}积分`)
      return
    }
    
    // 获取本周奖池
    const poolStickers = await getWeeklyPoolStickers()
    
    if (poolStickers.length === 0) {
      ctx.body = error(ErrorCodes.PARAM_ERROR, '本周奖池为空')
      return
    }
    
    // 按稀有度分组
    const stickersByRarity = { N: [], R: [], SR: [], SSR: [] }
    for (const sticker of poolStickers) {
      if (stickersByRarity[sticker.rarity]) {
        stickersByRarity[sticker.rarity].push(sticker)
      }
    }
    
    // 概率：N:70% R:20% SR:8% SSR:2%
    const probabilities = { N: 0.7, R: 0.2, SR: 0.08, SSR: 0.02 }
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
    let availableStickers = stickersByRarity[selectedRarity]
    if (availableStickers.length === 0) {
      // 向下兼容
      for (const rarity of ['SR', 'R', 'N']) {
        if (stickersByRarity[rarity].length > 0) {
          selectedRarity = rarity
          availableStickers = stickersByRarity[rarity]
          break
        }
      }
    }
    
    const selectedSticker = availableStickers[Math.floor(Math.random() * availableStickers.length)]
    
    // 扣除积分
    await subtractPoints(userId, DRAW_COST, PointType.LOTTERY, {
      description: `贴纸抽奖消耗 ${DRAW_COST} 星星`
    })
    
    // 检查用户是否已有该贴纸
    const existingResult = await pool.query(
      'SELECT id FROM user_stickers WHERE user_id = $1 AND sticker_id = $2',
      [userId, selectedSticker.id]
    )
    
    let awarded = false
    if (existingResult.rows.length === 0) {
      // 发放贴纸
      await pool.query(
        'INSERT INTO user_stickers (user_id, sticker_id) VALUES ($1, $2)',
        [userId, selectedSticker.id]
      )
      awarded = true
    }
    
    // 记录抽奖
    await pool.query(
      'INSERT INTO sticker_lottery (user_id, sticker_id, result_type) VALUES ($1, $2, $3)',
      [userId, selectedSticker.id, awarded ? 'awarded' : 'duplicate']
    )
    
    // 更新进度
    await pool.query(
      'UPDATE sticker_lottery_progress SET draw_count = draw_count + 1 WHERE user_id = $1',
      [userId]
    )
    
    // 获取最新进度
    const progressResult = await pool.query(
      'SELECT draw_count, guarantee_exchange_used FROM sticker_lottery_progress WHERE user_id = $1',
      [userId]
    )
    const progress = progressResult.rows[0] || { draw_count: 1, guarantee_exchange_used: false }
    
    ctx.body = success({
      sticker: {
        id: selectedSticker.id,
        name: selectedSticker.name,
        emoji: selectedSticker.emoji,
        rarity: selectedSticker.rarity,
        description: selectedSticker.description
      },
      awarded,
      starsSpent: DRAW_COST,
      remainingStars: currentStars - DRAW_COST,
      drawCount: progress.draw_count,
      canGuaranteeExchange: progress.draw_count >= GUARANTEE_COUNT && !progress.guarantee_exchange_used
    })
  } catch (err) {
    console.error('Draw error:', err)
    ctx.body = error(500, '抽奖失败')
  }
})

// 保底兑换（20次后可用）
router.post('/guarantee-exchange/:userId', async (ctx) => {
  const { userId } = ctx.params
  const { stickerId } = ctx.request.body
  
  if (!stickerId) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '请选择要兑换的贴纸')
    return
  }
  
  try {
    // 检查进度
    const progressResult = await pool.query(
      'SELECT draw_count, guarantee_exchange_used FROM sticker_lottery_progress WHERE user_id = $1',
      [userId]
    )
    const progress = progressResult.rows[0]
    
    if (!progress || progress.draw_count < GUARANTEE_COUNT) {
      ctx.body = error(ErrorCodes.PARAM_ERROR, `还需要${GUARANTEE_COUNT - (progress?.draw_count || 0)}次才能使用保底`)
      return
    }
    
    if (progress.guarantee_exchange_used) {
      ctx.body = error(ErrorCodes.PARAM_ERROR, '本期已使用过保底兑换')
      return
    }
    
    // 验证贴纸存在
    const stickerResult = await pool.query(
      'SELECT * FROM stickers WHERE id = $1',
      [stickerId]
    )
    if (stickerResult.rows.length === 0) {
      ctx.body = error(ErrorCodes.PARAM_ERROR, '贴纸不存在')
      return
    }
    const sticker = stickerResult.rows[0]
    
    // 检查用户是否已有该贴纸
    const existingResult = await pool.query(
      'SELECT id FROM user_stickers WHERE user_id = $1 AND sticker_id = $2',
      [userId, stickerId]
    )
    if (existingResult.rows.length > 0) {
      ctx.body = error(ErrorCodes.PARAM_ERROR, '已拥有该贴纸')
      return
    }
    
    // 发放贴纸（免费）
    await pool.query(
      'INSERT INTO user_stickers (user_id, sticker_id) VALUES ($1, $2)',
      [userId, stickerId]
    )
    
    // 标记保底已使用
    await pool.query(
      'UPDATE sticker_lottery_progress SET guarantee_exchange_used = true WHERE user_id = $1',
      [userId]
    )
    
    // 记录
    await pool.query(
      'INSERT INTO sticker_lottery (user_id, sticker_id, result_type) VALUES ($1, $2, $3)',
      [userId, stickerId, 'guarantee_exchange']
    )
    
    ctx.body = success({
      sticker: {
        id: sticker.id,
        name: sticker.name,
        emoji: sticker.emoji,
        rarity: sticker.rarity,
        description: sticker.description
      },
      message: '保底兑换成功！'
    })
  } catch (err) {
    console.error('Guarantee exchange error:', err)
    ctx.body = error(500, '兑换失败')
  }
})

// 获取所有可选兑换贴纸（保底时选择）
router.get('/exchange-options/:userId', async (ctx) => {
  const { userId } = ctx.params
  
  try {
    // 获取用户已有的贴纸
    const ownedResult = await pool.query(
      'SELECT sticker_id FROM user_stickers WHERE user_id = $1',
      [userId]
    )
    const ownedIds = ownedResult.rows.map(r => r.sticker_id)
    
    // 获取本周奖池贴纸（可兑换列表）
    const poolStickers = await getWeeklyPoolStickers()
    
    // 过滤掉已有的
    const availableStickers = poolStickers.filter(s => !ownedIds.includes(s.id))
    
    // 获取贴纸详情
    const stickerIds = availableStickers.map(s => s.id)
    let stickers = []
    if (stickerIds.length > 0) {
      const result = await pool.query(
        `SELECT id, name, emoji, rarity, description FROM stickers WHERE id = ANY($1)`,
        [stickerIds]
      )
      stickers = result.rows
    }
    
    ctx.body = success(stickers)
  } catch (err) {
    console.error('Get exchange options error:', err)
    ctx.body = success([])
  }
})

// 工具函数：获取当前周标识
function getCurrentWeekIdentifier() {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  return `${year}-W${String(weekNumber).padStart(2, '0')}`
}

// 工具函数：获取本周开始日期
function getWeekStartDate() {
  const now = new Date()
  const dayOfWeek = now.getDay() || 7
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - dayOfWeek + 1)
  return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
}

// 工具函数：获取本周结束日期
function getWeekEndDate() {
  const now = new Date()
  const dayOfWeek = now.getDay() || 7
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() - dayOfWeek + 7)
  return `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`
}

// 工具函数：判断两个日期是否在同一周
function isSameWeek(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const year1 = d1.getFullYear()
  const year2 = d2.getFullYear()
  const startOfYear1 = new Date(year1, 0, 1)
  const startOfYear2 = new Date(year2, 0, 1)
  const days1 = Math.floor((d1 - startOfYear1) / (24 * 60 * 60 * 1000))
  const days2 = Math.floor((d2 - startOfYear2) / (24 * 60 * 60 * 1000))
  const week1 = Math.ceil((days1 + startOfYear1.getDay() + 1) / 7)
  const week2 = Math.ceil((days2 + startOfYear2.getDay() + 1) / 7)
  return year1 === year2 && week1 === week2
}

export default router
