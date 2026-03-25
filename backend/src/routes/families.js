import Router from '@koa/router'
import { getFamily, updateFamily, generateInviteCode, getChildren, removeMember, getFamilyByCode, addChild } from '../controllers/family.js'
import { error, success } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'
import pool from '../config/database.js'

const router = new Router({ prefix: '/api/family' })

router.get('/', getFamily)
router.put('/', updateFamily)
router.post('/invite', generateInviteCode)
router.get('/children', getChildren)
router.delete('/member/:userId', removeMember)
router.post('/child', addChild)
router.get('/by-code/:code', getFamilyByCode)

// 获取家庭成员今日任务进度（家长专用）
router.get('/children-task-progress', async (ctx) => {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(401, '未登录')
    return
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // 获取所有孩子
    const childrenResult = await pool.query(
      "SELECT id, nickname, avatar, role, level, stars FROM users WHERE family_id = $1 AND role = 'child'",
      [decoded.familyId]
    )
    
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    const cycleStart = new Date()
    cycleStart.setHours(0, 0, 0, 0)
    // 本周一零点
    const dayOfWeek = now.getDay()
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - daysSinceMonday)
    weekStart.setHours(0, 0, 0, 0)
    
    const children = []
    for (const child of childrenResult.rows) {
      // 获取今日完成任务数
      const todayTasksResult = await pool.query(
        "SELECT COUNT(*) as count FROM task_logs WHERE user_id = $1 AND action = 'complete' AND approval_status = 'approved' AND completed_date = $2",
        [child.id, today]
      )
      
      // 获取本周（周一至今）完成任务数
      const weekTasksResult = await pool.query(
        "SELECT COUNT(*) as count FROM task_logs WHERE user_id = $1 AND action = 'complete' AND approval_status = 'approved' AND completed_date >= $2",
        [child.id, weekStart.toISOString().split('T')[0]]
      )
      
      // 获取待审批任务数
      const pendingResult = await pool.query(
        "SELECT COUNT(*) as count FROM task_logs WHERE user_id = $1 AND approval_status = 'pending'",
        [child.id]
      )
      
      children.push({
        ...child,
        todayCompleted: parseInt(todayTasksResult.rows[0]?.count || 0),
        weekCompleted: parseInt(weekTasksResult.rows[0]?.count || 0),
        pendingCount: parseInt(pendingResult.rows[0]?.count || 0)
      })
    }
    
    ctx.body = success(children)
  } catch (err) {
    console.error('GetChildrenTaskProgress error:', err)
    ctx.body = error(500, '获取失败')
  }
})

export default router
