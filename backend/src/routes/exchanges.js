import Router from 'koa-router'
import { getExchanges, createExchange, updateExchange } from '../controllers/exchange.js'
const router = new Router({ prefix: '/api/exchanges' })
router.get('/', getExchanges)
router.post('/', createExchange)
router.put('/:id', updateExchange)
export default router
