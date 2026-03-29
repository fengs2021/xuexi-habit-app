import Router from '@koa/router'
import { createExchange, getStudentHistory } from '../controllers/exchange.js'

const router = new Router({ prefix: '/api/exchanges' })

// 孩子端创建兑换
router.post('/', createExchange)

// 孩子的兑换历史（家长审批后孩子可查看）
router.get('/student-history', getStudentHistory)

export default router
