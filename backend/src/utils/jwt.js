// JWT 密钥必须通过环境变量设置
// 在首次调用时检查，而非模块加载时
let cachedSecret = null

function getJwtSecret() {
  if (cachedSecret) return cachedSecret
  
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('【安全错误】JWT_SECRET 环境变量未设置，禁止启动！')
    }
    console.warn('【警告】使用默认 JWT_SECRET，请设置 JWT_SECRET 环境变量')
    cachedSecret = 'xuexi-dev-secret-do-not-use-in-production'
  } else {
    cachedSecret = secret
  }
  return cachedSecret
}

export default getJwtSecret()
