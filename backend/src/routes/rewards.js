import Router from 'koa-router'
import { getRewards, createReward, updateReward, deleteReward } from '../controllers/reward.js'
const router = new Router({ prefix: '/api/rewards' })
router.get('/', getRewards)
router.post('/', createReward)
router.put('/:id', updateReward)
router.delete('/:id', deleteReward)
export default router
