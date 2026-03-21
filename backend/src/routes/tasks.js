import Router from '@koa/router'
import { getTasks, createTask, updateTask, completeTask, skipTask, deleteTask, getStudentTaskStatus, approveTaskLog } from '../controllers/task.js'

const router = new Router({ prefix: '/api/tasks' })

router.get('/', getTasks)
router.post('/', createTask)
router.put('/:id', updateTask)
router.post('/:id/complete', completeTask)
router.post('/:id/skip', skipTask)
router.delete('/:id', deleteTask)
router.get('/student-status', getStudentTaskStatus)
router.post('/log/:id/approve', approveTaskLog)

export default router
