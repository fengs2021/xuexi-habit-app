
// Helper to get user stars from summary table
async function getUserStars(userId) {
  const summaryResult = await pool.query(
    'SELECT total_earned, total_used FROM user_point_summary WHERE user_id = $1',
    [userId]
  )
  const summary = summaryResult.rows[0] || { total_earned: 0, total_used: 0 }
  return {
    stars: parseInt(summary.total_earned || 0) - parseInt(summary.total_used || 0),
    totalStars: parseInt(summary.total_earned || 0),
    usedStars: parseInt(summary.total_used || 0)
  }
}

import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10
const ACCESS_TOKEN_EXPIRY = '2h'
const REFRESH_TOKEN_EXPIRY = '7d'

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, nickname: user.nickname, role: user.role, familyId: user.family_id },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  )
  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  )
  return { accessToken, refreshToken }
}

export async function registerParent(ctx) {
  const { phone, password, nickname, familyName, inviteCode } = ctx.request.body
  if (!phone || !password || !nickname) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '手机号、密码、昵称为必填项')
    return
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone])
    if (existing.rows.length > 0) {
      ctx.body = error(2001, '手机号已被注册')
      return
    }
    
    let family
    if (inviteCode) {
      const familyResult = await pool.query('SELECT * FROM family WHERE code = $1', [inviteCode])
      if (familyResult.rows.length === 0) {
        ctx.body = error(404, '邀请码无效')
        return
      }
      family = familyResult.rows[0]
    } else {
      const familyCode = Math.random().toString(36).substr(2, 6).toUpperCase()
      const familyResult = await pool.query(
        'INSERT INTO family (name, code) VALUES ($1, $2) RETURNING *',
        [familyName || '我的家庭', familyCode]
      )
      family = familyResult.rows[0]
    }
    
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const userResult = await pool.query(
      `INSERT INTO users (family_id, phone, password_hash, nickname, role, level, stars) 
       VALUES ($1, $2, $3, $4, 'admin', 1, 0) RETURNING *`,
      [family.id, phone, passwordHash, nickname]
    )
    const user = userResult.rows[0]
    if (!inviteCode) {
      await pool.query('UPDATE family SET owner_id = $1 WHERE id = $2', [user.id, family.id])
    }
    const { accessToken, refreshToken } = generateTokens(user)
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [user.id, refreshToken]
    )
    ctx.body = success({
      token: accessToken,
      refreshToken,
      user: { id: user.id, nickname: user.nickname, role: user.role, familyId: family.id, familyName: family.name, level: user.level, stars: user.stars }
    })
  } catch (err) {
    console.error('RegisterParent error:', err)
    ctx.body = error(500, '注册失败')
  }
}

export async function registerChild(ctx) {
  const { inviteCode, nickname } = ctx.request.body
  if (!inviteCode || !nickname) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '邀请码和昵称为必填项')
    return
  }
  try {
    const familyResult = await pool.query('SELECT * FROM family WHERE code = $1', [inviteCode])
    if (familyResult.rows.length === 0) {
      ctx.body = error(2003, '邀请码无效')
      return
    }
    const family = familyResult.rows[0]
    const deviceId = 'device_' + Math.random().toString(36).substr(2, 12)
    const userResult = await pool.query(
      `INSERT INTO users (family_id, openid, nickname, role, level, stars) 
       VALUES ($1, $2, $3, 'child', 1, 0) RETURNING *`,
      [family.id, deviceId, nickname]
    )
    const user = userResult.rows[0]
    const { accessToken, refreshToken } = generateTokens(user)
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [user.id, refreshToken]
    )
    ctx.body = success({
      token: accessToken,
      refreshToken,
      user: { id: user.id, nickname: user.nickname, role: user.role, familyId: family.id, familyName: family.name, deviceId, level: user.level, stars: user.stars }
    })
  } catch (err) {
    console.error('RegisterChild error:', err)
    ctx.body = error(500, '注册失败')
  }
}

export async function loginParent(ctx) {
  const { phone, password } = ctx.request.body
  if (!phone || !password) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '手机号和密码为必填项')
    return
  }
  try {
    const userResult = await pool.query(
      'SELECT u.*, f.name as family_name FROM users u LEFT JOIN family f ON u.family_id = f.id WHERE u.phone = $1',
      [phone]
    )
    if (userResult.rows.length === 0) {
      ctx.body = error(2001, '用户不存在')
      return
    }
    const user = userResult.rows[0]
    if (!user.password_hash) {
      ctx.body = error(1003, '请使用设备登录')
      return
    }
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      ctx.body = error(1003, '密码错误')
      return
    }
    const { accessToken, refreshToken } = generateTokens(user)
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [user.id, refreshToken]
    )
    ctx.body = success({
      token: accessToken,
      refreshToken,
      user: { id: user.id, nickname: user.nickname, role: user.role, familyId: user.family_id, familyName: user.family_name, level: user.level, stars: user.stars }
    })
  } catch (err) {
    console.error('LoginParent error:', err)
    ctx.body = error(500, '登录失败')
  }
}

export async function loginDevice(ctx) {
  const { deviceId, userId } = ctx.request.body
  if (!deviceId && !userId) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '设备ID或用户ID为必填项')
    return
  }
  try {
    const queryId = deviceId || userId
    const userResult = await pool.query(
      'SELECT u.*, f.name as family_name FROM users u LEFT JOIN family f ON u.family_id = f.id WHERE u.id = $1',
      [queryId]
    )
    if (userResult.rows.length === 0) {
      ctx.body = error(2001, '用户不存在')
      return
    }
    const user = userResult.rows[0]
    const { accessToken, refreshToken } = generateTokens(user)
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [user.id, refreshToken]
    )
    ctx.body = success({
      token: accessToken,
      refreshToken,
      user: { id: user.id, nickname: user.nickname, role: user.role, familyId: user.family_id, familyName: user.family_name, level: user.level, stars: user.stars }
    })
  } catch (err) {
    console.error('LoginDevice error:', err)
    ctx.body = error(500, '登录失败')
  }
}

export async function refreshToken(ctx) {
  const { refreshToken } = ctx.request.body
  if (!refreshToken) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, 'refreshToken为必填项')
    return
  }
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET)
    if (decoded.type !== 'refresh') {
      ctx.body = error(1003, '无效的refreshToken')
      return
    }
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id])
    if (userResult.rows.length === 0) {
      ctx.body = error(2001, '用户不存在')
      return
    }
    const user = userResult.rows[0]
    const tokens = generateTokens(user)
    await pool.query(
      'UPDATE refresh_tokens SET token_hash = $1, expires_at = NOW() + INTERVAL \'7 days\' WHERE user_id = $2',
      [tokens.refreshToken, user.id]
    )
    ctx.body = success({ token: tokens.accessToken, refreshToken: tokens.refreshToken })
  } catch (err) {
    console.error('RefreshToken error:', err)
    ctx.body = error(1003, 'Token已过期')
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
    const userResult = await pool.query(
      'SELECT u.*, f.name as family_name FROM users u LEFT JOIN family f ON u.family_id = f.id WHERE u.id = $1',
      [decoded.id]
    )
    if (userResult.rows.length === 0) {
      ctx.body = error(2001, '用户不存在')
      return
    }
    const user = userResult.rows[0]
    
    // Get stars from summary table
    const starInfo = await getUserStars(user.id)
    
    ctx.body = success({
      id: user.id,
      nickname: user.nickname,
      role: user.role,
      avatar: user.avatar,
      familyId: user.family_id,
      familyName: user.family_name,
      level: user.level,
      stars: starInfo.stars,
      totalStars: starInfo.totalStars,
      usedStars: starInfo.usedStars,
      wishPoints: user.wish_points
    })
  } catch (err) {
    console.error('Me error:', err)
    ctx.body = error(500, '获取用户信息失败')
  }
}

export async function logout(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = success({})
    return
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [decoded.id])
    ctx.body = success({})
  } catch (err) {
    ctx.body = success({})
  }
}
