import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'

function generateToken(user) {
  return jwt.sign(
    { id: user.id, nickname: user.nickname, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

export async function login(ctx) {
  const { deviceId } = ctx.request.body
  if (!deviceId) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '缺少设备ID')
    return
  }
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE openid = $1', [deviceId])
    if (userResult.rows.length === 0) {
      ctx.body = error(ErrorCodes.USER_NOT_FOUND, '用户不存在')
      return
    }
    const user = userResult.rows[0]
    const token = generateToken(user)
    ctx.body = success({
      token,
      user: { id: user.id, nickname: user.nickname, role: user.role, level: user.level, stars: user.stars, avatar: user.avatar }
    })
  } catch (err) {
    console.error('Login error:', err)
    ctx.body = error(500, '登录失败')
  }
}

export async function register(ctx) {
  const { nickname, role, deviceId } = ctx.request.body
  if (!nickname || !deviceId) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '缺少必填参数')
    return
  }
  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE openid = $1', [deviceId])
    if (existingUser.rows.length > 0) {
      return login(ctx)
    }
    const familyResult = await pool.query(
      'INSERT INTO family (name, code) VALUES ($1, $2) RETURNING *',
      ['我的家庭', Math.random().toString(36).substr(2, 6).toUpperCase()]
    )
    const family = familyResult.rows[0]
    const userResult = await pool.query(
      'INSERT INTO users (family_id, openid, nickname, role, level, stars) VALUES ($1, $2, $3, $4, 1, 0) RETURNING *',
      [family.id, deviceId, nickname, role || 'child']
    )
    const user = userResult.rows[0]
    await pool.query('UPDATE family SET owner_id = $1 WHERE id = $2', [user.id, family.id])
    const token = generateToken(user)
    ctx.body = success({
      token,
      user: { id: user.id, nickname: user.nickname, role: user.role, level: user.level, stars: user.stars, avatar: user.avatar }
    })
  } catch (err) {
    console.error('Register error:', err)
    ctx.body = error(500, '注册失败')
  }
}

export async function me(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id])
    if (userResult.rows.length === 0) {
      ctx.body = error(ErrorCodes.USER_NOT_FOUND, '用户不存在')
      return
    }
    const user = userResult.rows[0]
    ctx.body = success({ id: user.id, nickname: user.nickname, role: user.role, level: user.level, stars: user.stars, avatar: user.avatar })
  } catch (err) {
    console.error('Me error:', err)
    ctx.body = error(500, '获取用户信息失败')
  }
}
