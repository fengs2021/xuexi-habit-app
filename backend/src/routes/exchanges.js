import Router from '@koa/router'
import { createExchange, getPendingExchanges, approveExchange, rejectExchange, getExchangeHistory, getStudentHistory } from '../controllers/exchange.js'

const router = new Router({ prefix: '/api/exchanges' })

router.post('/', createExchange)
router.get('/pending', getPendingExchanges)
router.put('/:id/approve', approveExchange)
router.put('/:id/reject', rejectExchange)
router.get('/history', getExchangeHistory)
router.get('/student-history', getStudentHistory)

export default router
