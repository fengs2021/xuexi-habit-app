import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'

// 获取家庭信息
export async function getFamily(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)

    const userResult = await pool.query('SELECT family_id FROM users WHERE id = ', [decoded.id])

    if (userResult.rows.length === 0) {
      ctx.body = error(ErrorCodes.USER_NOT_FOUND, '用户不存在')
      return
    }

    const familyId = userResult.rows[0].family_id

    const familyResult = await pool.query('SELECT * FROM family WHERE id = ', [familyId])

    if (familyResult.rows.length === 0) {
      ctx.body = error(ErrorCodes.FAMILY_NOT_FOUND, '家庭不存在')
      return
    }

    const family = familyResult.rows[0]
    const membersResult = await pool.query(
      'SELECT id, nickname, avatar, role, level, stars, is_current FROM users WHERE family_id = ',
      [familyId]
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

// 更新家庭信息
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

    const userResult = await pool.query('SELECT family_id FROM users WHERE id = ', [decoded.id])

    if (userResult.rows.length === 0) {
      ctx.body = error(ErrorCodes.USER_NOT_FOUND, '用户不存在')
      return
    }

    await pool.query('UPDATE family SET name =  WHERE id = ', [name, userResult.rows[0].family_id])
    ctx.body = success({ name })
  } catch (err) {
    console.error('UpdateFamily error:', err)
    ctx.body = error(500, '更新失败')
  }
}

export async function joinFamily(ctx) {
  ctx.body = error(500, '功能开发中')
}

export async function getFamilyMembers(ctx) {
  return getFamily(ctx)
}
