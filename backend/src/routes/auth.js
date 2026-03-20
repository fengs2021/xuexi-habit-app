import Router from 'koa-router'
import { login, register, me } from '../controllers/auth.js'

const router = new Router({ prefix: '/api/auth' })

router.post('/login', login)
router.post('/register', register)
router.get('/me', me)

export default router
