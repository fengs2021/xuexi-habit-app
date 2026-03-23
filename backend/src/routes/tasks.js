import Router from '@koa/router'
import { getTasks, createTask, updateTask, completeTask, skipTask, deleteTask, getStudentTaskStatus, approveTaskLog, deductStars } from '../controllers/task.js'

const router = new Router({ prefix: '/api/tasks' })

router.get('/', getTasks)
router.post('/', createTask)
router.put('/:id', updateTask)
router.post('/:id/complete', completeTask)
router.post('/:id/skip', skipTask)
router.delete('/:id', deleteTask)
router.get('/student-status', getStudentTaskStatus)
router.post('/log/:id/approve', approveTaskLog)

router.post('/deduct', deductStars)

export default router
