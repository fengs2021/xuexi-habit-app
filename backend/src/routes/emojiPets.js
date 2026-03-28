import Router from '@koa/router'
import { success, error } from '../utils/response.js'
import pool from '../config/database.js'

const router = new Router({ prefix: '/api/emoji-pets' })

// 获取用户可用的表情宠物列表
router.get('/:userId', async (ctx) => {
  const { userId } = ctx.params
  try {
    const result = await pool.query(
      `SELECT e.id, e.emoji, e.name, e.pool_type
       FROM emoji_pets e
       INNER JOIN user_emoji_pets ue ON ue.emoji_pet_id = e.id
       WHERE ue.user_id = $1 AND e.pool_type = 'available'
       ORDER BY e.id`,
      [userId]
    )
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('Get user emoji pets error:', err)
    ctx.body = error(500, '获取表情宠物失败')
  }
})

// 获取所有表情宠物及其锁定状态
router.get('/:userId/all', async (ctx) => {
  const { userId } = ctx.params
  try {
    const result = await pool.query(
      `SELECT e.id, e.emoji, e.name, e.pool_type,
              CASE WHEN ue.id IS NOT NULL THEN true ELSE false END as owned
       FROM emoji_pets e
       LEFT JOIN user_emoji_pets ue ON ue.emoji_pet_id = e.id AND ue.user_id = $1
       ORDER BY e.id`,
      [userId]
    )
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('Get all emoji pets error:', err)
    ctx.body = error(500, '获取表情宠物失败')
  }
})

// 解锁表情宠物
router.post('/unlock/:userId/:emojiPetId', async (ctx) => {
  const { userId, emojiPetId } = ctx.params
  try {
    await pool.query(
      'INSERT INTO user_emoji_pets (user_id, emoji_pet_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, emojiPetId]
    )
    ctx.body = success({ ok: true })
  } catch (err) {
    console.error('Unlock emoji pet error:', err)
    ctx.body = error(500, '解锁表情宠物失败')
  }
})

export default router
