import pg from 'pg'
const { Pool } = pg

// 解析 DATABASE_URL 环境变量
function parseDatabaseUrl(url) {
  if (!url) {
    // 生产环境必须提供 DATABASE_URL，禁止使用默认密码
    if (process.env.NODE_ENV === 'production') {
      throw new Error('【安全错误】生产环境必须设置 DATABASE_URL 环境变量！')
    }
    return { host: 'localhost', port: 5432, database: 'xuexi', user: 'postgres', password: 'xuexi123456' }
  }
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
  if (match) {
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: parseInt(match[4]),
      database: match[5]
    }
  }
  // 仍然允许不通过 URL 的配置
  return { 
    host: process.env.DB_HOST || 'localhost', 
    port: parseInt(process.env.DB_PORT || '5432'), 
    database: process.env.DB_NAME || 'xuexi', 
    user: process.env.DB_USER || 'postgres', 
    password: process.env.DB_PASSWORD || 'xuexi123456' 
  }
}

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL)

// 生产环境禁止打印数据库配置
if (process.env.NODE_ENV !== 'production') {
  console.log('Database config:', { host: dbConfig.host, port: dbConfig.port, database: dbConfig.database })
}

const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  // 连接池配置 - 提高稳定性
  max: 20,                     // 最大连接数
  idleTimeoutMillis: 30000,    // 空闲30秒后关闭
  connectionTimeoutMillis: 5000, // 连接超时5秒
  // 自动重连
  allowExitOnIdle: false
})

// 连接池错误处理 - 不让数据库错误导致崩溃
pool.on('error', (err, client) => {
  console.error('【数据库连接池错误】:', err.message)
  // 错误已被处理，不关闭应用
})

// 定期检查连接健康
setInterval(async () => {
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
  } catch (e) {
    console.error('【数据库健康检查失败】:', e.message)
  }
}, 60000) // 每分钟检查一次

export default pool
