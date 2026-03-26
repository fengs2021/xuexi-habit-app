import Router from 'koa-router'
import { getPendingApprovals, getApprovalHistory, approveTaskCompletion, approveExchange, reverseApproval } from '../controllers/approval.js'

const router = new Router({ prefix: '/api/approvals' })

router.get('/pending', getPendingApprovals)
router.get('/history', getApprovalHistory)
router.put('/task/:id', approveTaskCompletion)
router.put('/exchange/:id', approveExchange)
router.put('/reverse/:id', reverseApproval)

export default router
