import Router from 'koa-router'
import { getLogs } from '../controllers/log.js'
const router = new Router({ prefix: '/api/logs' })
router.get('/', getLogs)
export default router
