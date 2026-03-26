import Router from '@koa/router'
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

const router = new Router({ prefix: '/api/display' })

router.get('/settings/:userId', async (ctx) => {
  const { userId } = ctx.params
  try {
    const result = await pool.query(
      'SELECT * FROM user_display_settings WHERE user_id = $1',
      [userId]
    )
    ctx.body = success(result.rows[0] || null)
  } catch (err) {
    ctx.body = error(500, err.message)
  }
})

router.put('/settings', async (ctx) => {
  const { userId, equippedAchievementId, equippedSticker1Id, equippedSticker2Id, theme, pet, avatarId } = ctx.request.body
  try {
    await pool.query(
      `INSERT INTO user_display_settings (user_id, equipped_achievement_id, equipped_sticker1_id, equipped_sticker2_id, theme, pet, avatar_id, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       equipped_achievement_id = $2,
       equipped_sticker1_id = $3,
       equipped_sticker2_id = $4,
       theme = $5,
       pet = COALESCE($6, user_display_settings.pet),
       avatar_id = COALESCE($7, user_display_settings.avatar_id),
       updated_at = NOW()`,
      [userId, equippedAchievementId, equippedSticker1Id, equippedSticker2Id, theme || 'pink', pet, avatarId]
    )
    ctx.body = success({ success: true })
  } catch (err) {
    console.error('PUT settings error:', err)
    ctx.body = error(500, err.message)
  }
})

export default router