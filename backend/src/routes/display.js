import Router from '@koa/router'
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

const router = new Router({ prefix: '/api/display' })

// 工具函数：获取当前周标识 YYYY-WXX
function getCurrentWeekIdentifier() {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  return `${year}-W${String(weekNumber).padStart(2, '0')}`
}

// 工具函数：检查头像是否对指定用户可装备（必须已解锁）
async function isAvatarEquippable(client, userId, avatarId) {
  if (!avatarId) return true
  // 只有 user_avatars 中已解锁的头像才能装备
  const unlocked = await client.query(
    'SELECT 1 FROM user_avatars WHERE user_id = $1 AND avatar_id = $2',
    [userId, avatarId]
  )
  return unlocked.rows.length > 0
}

router.get('/settings/:userId', async (ctx) => {
  const { userId } = ctx.params
  try {
    const result = await pool.query(
      'SELECT * FROM user_display_settings WHERE user_id = $1',
      [userId]
    )
    const settings = result.rows[0] || null
    if (settings && settings.avatar_id) {
      // 附加头像的 locked 状态（已在 user_avatars 中 = 可继续使用）
      const isUnlocked = await pool.query(
        'SELECT 1 FROM user_avatars WHERE user_id = $1 AND avatar_id = $2',
        [userId, settings.avatar_id]
      )
      settings.avatar_locked = isUnlocked.rows.length === 0
    }
    ctx.body = success(settings)
  } catch (err) {
    ctx.body = error(500, err.message)
  }
})

router.put('/settings', async (ctx) => {
  const { userId, equippedAchievementId, equippedSticker1Id, equippedSticker2Id, theme, pet, avatarId } = ctx.request.body
  try {
    // 如果设置了头像，检查是否可装备
    if (avatarId) {
      const equippable = await isAvatarEquippable(pool, userId, avatarId)
      if (!equippable) {
        ctx.body = error(403, '该头像尚未解锁，无法装备')
        return
      }
    }

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
