import Router from '@koa/router'
import { getGoals, createGoal, updateGoal, deleteGoal } from '../controllers/goal.js'
const router = new Router({ prefix: '/api/goals' })
router.get('/', getGoals)
router.post('/', createGoal)
router.put('/:id', updateGoal)
router.delete('/:id', deleteGoal)
export default router
