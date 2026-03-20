import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'xuexi',
  user: 'postgres',
  password: 'xuexi123456'
})

pool.on('connect', () => {
  console.log('Database connected')
})

pool.on('error', (err) => {
  console.error('Database error:', err)
})

export default pool
