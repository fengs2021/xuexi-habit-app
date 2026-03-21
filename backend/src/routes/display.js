import Router from '@koa/router'
import pool from '../config/database.js'
import { success } from '../utils/response.js'

const router = new Router({ prefix: '/api/display' })

router.get('/settings/:userId', async (ctx) => {
  const { userId } = ctx.params
  const result = await pool.query(
    'SELECT * FROM user_display_settings WHERE user_id = $1',
    [userId]
  )
  ctx.body = success(result.rows[0] || null)
})

router.put('/settings', async (ctx) => {
  const { userId, equippedAchievementId, equippedSticker1Id, equippedSticker2Id } = ctx.request.body
  
  await pool.query(
    `INSERT INTO user_display_settings (user_id, equipped_achievement_id, equipped_sticker1_id, equipped_sticker2_id, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       equipped_achievement_id = $2,
       equipped_sticker1_id = $3,
       equipped_sticker2_id = $4,
       updated_at = NOW()`,
    [userId, equippedAchievementId, equippedSticker1Id, equippedSticker2Id]
  )
  ctx.body = success({ success: true })
})

export default router
