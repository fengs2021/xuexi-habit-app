import Router from 'koa-router'
import { getAchievements, getAchievementStats } from '../controllers/achievement.js'
const router = new Router({ prefix: '/api/achievements' })
router.get('/', getAchievements)
router.get('/stats', getAchievementStats)
export default router
