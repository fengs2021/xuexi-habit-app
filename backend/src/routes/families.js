import Router from '@koa/router'
import { getFamily, updateFamily, generateInviteCode, getChildren, removeMember } from '../controllers/family.js'

const router = new Router({ prefix: '/api/family' })

router.get('/', getFamily)
router.put('/', updateFamily)
router.post('/invite', generateInviteCode)
router.get('/children', getChildren)
router.delete('/member/:userId', removeMember)

export default router
