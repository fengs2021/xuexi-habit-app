import Router from '@koa/router'
import { registerParent, registerChild, loginParent, loginDevice, loginById, refreshToken, me, logout } from '../controllers/auth.js'

const router = new Router({ prefix: '/api/auth' })

router.post('/register/parent', registerParent)
router.post('/register/child', registerChild)
router.post('/login/parent', loginParent)
router.post('/login/device', loginDevice)
router.post('/refresh', refreshToken)
router.get('/me', me)
router.post('/logout', logout)

export default router

router.post('/login/child', loginById)
