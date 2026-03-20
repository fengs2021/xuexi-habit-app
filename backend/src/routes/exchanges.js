import Router from '@koa/router'
import { createExchange, getPendingExchanges, approveExchange, rejectExchange, getExchangeHistory } from '../controllers/exchange.js'

const router = new Router({ prefix: '/api/exchanges' })

router.post('/', createExchange)
router.get('/pending', getPendingExchanges)
router.put('/:id/approve', approveExchange)
router.put('/:id/reject', rejectExchange)
router.get('/history', getExchangeHistory)

export default router
