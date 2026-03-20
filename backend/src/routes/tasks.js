import Router from 'koa-router'
import { getTasks, createTask, completeTask, skipTask, deleteTask } from '../controllers/task.js'

const router = new Router({ prefix: '/api/tasks' })

router.get('/', getTasks)
router.post('/', createTask)
router.post('/:id/complete', completeTask)
router.post('/:id/skip', skipTask)
router.delete('/:id', deleteTask)

export default router
