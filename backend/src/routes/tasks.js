import Router from 'koa-router'
import { getTasks, createTask, updateTask, deleteTask, completeTask, skipTask } from '../controllers/task.js'
const router = new Router({ prefix: '/api/tasks' })
router.get('/', getTasks)
router.post('/', createTask)
router.put('/:id', updateTask)
router.delete('/:id', deleteTask)
router.post('/:id/complete', completeTask)
router.post('/:id/skip', skipTask)
export default router
