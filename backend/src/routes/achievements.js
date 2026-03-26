import Router from '@koa/router'
import pool from '../config/database.js'
import { success } from '../utils/response.js'

const router = new Router({ prefix: '/api/achievements' })

router.get('/', async (ctx) => {
  const result = await pool.query('SELECT * FROM achievement_definitions ORDER BY id')
  ctx.body = success(result.rows)
})

router.get('/user/:userId', async (ctx) => {
  const { userId } = ctx.params
  const result = await pool.query(
    'SELECT a.*, ua.unlocked_at as earned_at FROM achievement_definitions a ' +
    'JOIN user_achievements ua ON a.id = ua.achievement_id ' +
    'WHERE ua.user_id = $1 ORDER BY ua.unlocked_at DESC',
    [userId]
  )
  ctx.body = success(result.rows)
})

export default router
