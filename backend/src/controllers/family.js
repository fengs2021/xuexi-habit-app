import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'

export async function getFamily(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)

    const familyResult = await pool.query('SELECT * FROM family WHERE id = $1', [decoded.familyId])
    if (familyResult.rows.length === 0) {
      ctx.body = error(ErrorCodes.FAMILY_NOT_FOUND, '家庭不存在')
      return
    }

    const family = familyResult.rows[0]
    const membersResult = await pool.query(
      'SELECT id, nickname, avatar, role, level, stars, is_active FROM users WHERE family_id = $1',
      [decoded.familyId]
    )

    ctx.body = success({
      id: family.id,
      name: family.name,
      code: family.code,
      members: membersResult.rows
    })
  } catch (err) {
    console.error('GetFamily error:', err)
    ctx.body = error(500, '获取家庭信息失败')
  }
}

export async function updateFamily(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    const { name } = ctx.request.body

    await pool.query('UPDATE family SET name = $1, updated_at = NOW() WHERE id = $2', [name, decoded.familyId])
    ctx.body = success({ name })
  } catch (err) {
    console.error('UpdateFamily error:', err)
    ctx.body = error(500, '更新失败')
  }
}

export async function generateInviteCode(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    
    if (!['admin', 'parent'].includes(decoded.role)) {
      ctx.body = error(ErrorCodes.NO_PERMISSION, '无权限')
      return
    }

    const newCode = Math.random().toString(36).substr(2, 6).toUpperCase()
    await pool.query('UPDATE family SET code = $1 WHERE id = $2', [newCode, decoded.familyId])
    ctx.body = success({ code: newCode })
  } catch (err) {
    console.error('GenerateInviteCode error:', err)
    ctx.body = error(500, '生成邀请码失败')
  }
}

export async function getChildren(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)

    const result = await pool.query(
      'SELECT id, nickname, avatar, level, stars, wish_points FROM users WHERE family_id = $1 AND role = $2',
      [decoded.familyId, 'child']
    )
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetChildren error:', err)
    ctx.body = error(500, '获取孩子列表失败')
  }
}

export async function removeMember(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    const memberId = ctx.params.userId

    if (!['admin'].includes(decoded.role)) {
      ctx.body = error(ErrorCodes.NO_PERMISSION, '无权限')
      return
    }

    if (memberId === decoded.id) {
      ctx.body = error(1003, '不能移除自己')
      return
    }

    await pool.query('DELETE FROM users WHERE id = $1 AND family_id = $2', [memberId, decoded.familyId])
    ctx.body = success({})
  } catch (err) {
    console.error('RemoveMember error:', err)
    ctx.body = error(500, '移除成员失败')
  }
}
