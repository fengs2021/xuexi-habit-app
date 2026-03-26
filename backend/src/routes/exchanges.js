import Router from '@koa/router'
import { createExchange, getPendingExchanges, approveExchange, rejectExchange, getExchangeHistory, getStudentHistory } from '../controllers/exchange.js'

const router = new Router({ prefix: '/api/exchanges' })

// 孩子端创建兑换
router.post('/', createExchange)

// 家长端统一审批入口已迁移到 /api/approvals/*
// 以下路由保留供直接调用（前端默认使用 /approvals/*）
router.get('/pending', getPendingExchanges)  // 前端使用 /approvals/pending
router.put('/:id/approve', approveExchange)  // 前端使用 /approvals/exchange/:id
router.put('/:id/reject', rejectExchange)  // 前端使用 /approvals/exchange/:id

// 兑换历史
router.get('/history', getExchangeHistory)
router.get('/student-history', getStudentHistory)

export default router
