import pool from '../src/config/database.js'

async function check() {
  const result = await pool.query("SELECT id, nickname, role, openid FROM users")
  console.log('All users:', JSON.stringify(result.rows, null, 2))
  await pool.end()
}

check()
