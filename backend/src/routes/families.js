import Router from 'koa-router'
import { getFamily, updateFamily, joinFamily, getFamilyMembers } from '../controllers/family.js'
const router = new Router({ prefix: '/api/family' })
router.get('/', getFamily)
router.put('/', updateFamily)
router.post('/join', joinFamily)
router.get('/members', getFamilyMembers)
export default router
