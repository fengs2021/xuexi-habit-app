import Router from '@koa/router'
import pool from '../config/database.js'
import { success } from '../utils/response.js'

const router = new Router({ prefix: '/api/stickers' })

router.get('/', async (ctx) => {
  const result = await pool.query('SELECT * FROM stickers ORDER BY CASE WHEN rarity = $1 THEN 1 WHEN rarity = $2 THEN 2 WHEN rarity = $3 THEN 3 WHEN rarity = $4 THEN 4 END, id', ['N', 'R', 'SR', 'SSR'])
  ctx.body = success(result.rows)
})

router.get('/user/:userId', async (ctx) => {
  const { userId } = ctx.params
  const result = await pool.query(
    'SELECT s.*, us.earned_at FROM stickers s ' +
    'JOIN user_stickers us ON s.id = us.sticker_id ' +
    'WHERE us.user_id = $1 ORDER BY us.earned_at DESC',
    [userId]
  )
  ctx.body = success(result.rows)
})

router.get('/user/:userId/ids', async (ctx) => {
  const { userId } = ctx.params
  const result = await pool.query(
    'SELECT sticker_id FROM user_stickers WHERE user_id = $1',
    [userId]
  )
  ctx.body = success(result.rows.map(r => r.sticker_id))
})

export default router
