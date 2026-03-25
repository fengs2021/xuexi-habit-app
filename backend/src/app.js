import Koa from 'koa'
import Router from 'koa-router'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import dotenv from 'dotenv'
import serve from 'koa-static'

// 路由
import authRoutes from './routes/auth.js'
import familyRoutes from './routes/families.js'
import goalRoutes from './routes/goals.js'
import taskRoutes from './routes/tasks.js'
import rewardRoutes from './routes/rewards.js'
import exchangeRoutes from './routes/exchanges.js'
import achievementRoutes from './routes/achievements.js'
import signinRoutes from './routes/signin.js'
// 宠物养护系统已移除（2026-03-25）
// import petRoutes from './routes/pet.js'
import approvalRoutes from './routes/approvals.js'
import logRoutes from './routes/logs.js'
import statisticsRoutes from './routes/statistics.js'
import stickersRoutes from './routes/stickers.js'
import displayRoutes from './routes/display.js'
import reportRoutes from './routes/report.js'
import backupRoutes from './routes/backup.js'
import streakRoutes from './routes/streak.js'
import wheelRoutes from './routes/wheel.js'
import avatarRoutes from './routes/avatars.js'

// 加载环境变量
// 优先从项目根目录的 .env 加载，否则尝试当前目录
try {
  dotenv.config({ path: process.cwd() + '/../.env' })
} catch (e) {
  dotenv.config()
}

const app = new Koa()
const PORT = process.env.PORT || 8080

// 中间件
// CORS 配置：生产环境必须指定具体域名
const corsOrigin = process.env.ALLOWED_ORIGIN || ''
if (!corsOrigin && process.env.NODE_ENV === 'production') {
  console.warn('【警告】生产环境未设置 ALLOWED_ORIGIN，默认拒绝所有跨域请求')
}
app.use(cors({
  origin: corsOrigin || false,  // 空字符串或未设置时拒绝
  credentials: true
}))
app.use(bodyParser())

// 路由
const router = new Router()

// 健康检查
router.get('/api/health', (ctx) => {
  ctx.body = { code: 0, message: 'ok', timestamp: new Date().toISOString() }
})

// 注册子路由
app.use(router.routes())
app.use(authRoutes.routes())
app.use(familyRoutes.routes())
app.use(goalRoutes.routes())
app.use(taskRoutes.routes())
app.use(rewardRoutes.routes())
app.use(exchangeRoutes.routes())
app.use(achievementRoutes.routes())
app.use(signinRoutes.routes())
// 宠物养护已移除 app.use(petRoutes.routes())
app.use(logRoutes.routes())
app.use(approvalRoutes.routes())
app.use(statisticsRoutes.routes())
app.use(stickersRoutes.routes())
app.use(displayRoutes.routes())
app.use(reportRoutes.routes())
app.use(backupRoutes.routes())
app.use(streakRoutes.routes())
app.use(wheelRoutes.routes())
app.use(avatarRoutes.routes())

// 静态文件服务 (头像)
app.use(serve('./public', { maxage: 86400000 }))

// 错误处理
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    console.error('【请求错误】:', err.message, err.stack)
    ctx.status = err.status || 500
    ctx.body = {
      code: 500,
      message: err.message || 'Internal Server Error',
      data: null
    }
  }
})

// ========== 全局异常处理 - 防止进程崩溃 ==========

// 未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('【严重错误-未捕获异常】:', err.message, err.stack)
  // 不立即退出，等待日志写入
  setTimeout(() => {
    console.log('【注意】进程因未捕获异常即将退出')
    process.exit(1)
  }, 1000)
})

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('【警告-未处理的Promise拒绝】:', reason)
})

// 优雅关闭
async function gracefulShutdown(signal) {
  console.log(`【关闭】收到 ${signal}，开始优雅关闭...`)
  
  // 停止接收新请求
  server.close(() => {
    console.log('【关闭】HTTP 服务器已关闭')
  })
  
  // 关闭数据库连接池
  try {
    const pool = (await import('./config/database.js')).default
    await pool.end()
    console.log('【关闭】数据库连接池已关闭')
  } catch (e) {
    console.error('【关闭】关闭数据库连接池失败:', e.message)
  }
  
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// ========== 启动服务器 ==========

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
})
