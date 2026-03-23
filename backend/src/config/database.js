import pg from 'pg'
const { Pool } = pg

// 解析 DATABASE_URL 环境变量
function parseDatabaseUrl(url) {
  if (!url) return { host: 'localhost', port: 5432, database: 'xuexi', user: 'postgres', password: 'xuexi123456' }
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
  return { host: 'localhost', port: 5432, database: 'xuexi', user: 'postgres', password: 'xuexi123456' }
}

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL)

console.log('Database config:', { host: dbConfig.host, port: dbConfig.port, database: dbConfig.database })

const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password
})

pool.on('connect', () => {
  console.log('Database connected')
})

pool.on('error', (err) => {
  console.error('Database error:', err)
})

export default pool
