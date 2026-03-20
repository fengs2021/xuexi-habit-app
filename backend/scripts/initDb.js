import pool from '../src/config/database.js'

async function initDb() {
  console.log('Initializing database v3.0...')
  try {
    await pool.query(`
      DROP TABLE IF EXISTS exchange_approvals CASCADE;
      DROP TABLE IF EXISTS refresh_tokens CASCADE;
      DROP TABLE IF EXISTS user_achievements CASCADE;
      DROP TABLE IF EXISTS achievement_definitions CASCADE;
      DROP TABLE IF EXISTS exchange_logs CASCADE;
      DROP TABLE IF EXISTS task_logs CASCADE;
      DROP TABLE IF EXISTS rewards CASCADE;
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS goals CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS family CASCADE;
    `);
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await pool.query(`CREATE TABLE family (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(100) NOT NULL DEFAULT '我的家庭', code VARCHAR(20) UNIQUE NOT NULL, owner_id UUID, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE users (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), family_id UUID REFERENCES family(id), phone VARCHAR(20) UNIQUE, password_hash VARCHAR(255), nickname VARCHAR(50) NOT NULL, avatar VARCHAR(500) DEFAULT '', role VARCHAR(20) DEFAULT 'child', level INTEGER DEFAULT 1, stars INTEGER DEFAULT 0, wish_points INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT TRUE, openid VARCHAR(100) UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`ALTER TABLE family ADD CONSTRAINT fk_family_owner FOREIGN KEY (owner_id) REFERENCES users(id)`);
    await pool.query(`CREATE TABLE goals (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), family_id UUID REFERENCES family(id) NOT NULL, user_id UUID REFERENCES users(id), title VARCHAR(100) NOT NULL, icon VARCHAR(50) DEFAULT 'star', difficulty INTEGER DEFAULT 10, star_target INTEGER DEFAULT 10, current_stars INTEGER DEFAULT 0, status VARCHAR(20) DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE tasks (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), family_id UUID REFERENCES family(id) NOT NULL, goal_id UUID REFERENCES goals(id), title VARCHAR(100) NOT NULL, icon VARCHAR(50) DEFAULT 'todo-o', star_reward INTEGER DEFAULT 1, rarity VARCHAR(20) DEFAULT 'N', frequency VARCHAR(20) DEFAULT 'daily', frequency_count INTEGER DEFAULT 1, is_active BOOLEAN DEFAULT TRUE, sort_order INTEGER DEFAULT 0, last_reset_date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE rewards (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), family_id UUID REFERENCES family(id) NOT NULL, title VARCHAR(100) NOT NULL, icon VARCHAR(50) DEFAULT 'gift', star_cost INTEGER NOT NULL, rarity VARCHAR(20) DEFAULT 'normal', is_active BOOLEAN DEFAULT TRUE, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE task_logs (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES users(id) NOT NULL, task_id UUID REFERENCES tasks(id) NOT NULL, action VARCHAR(20) NOT NULL, stars_earned INTEGER DEFAULT 0, completed_date DATE NOT NULL DEFAULT CURRENT_DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE exchange_logs (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES users(id) NOT NULL, reward_id UUID REFERENCES rewards(id) NOT NULL, stars_spent INTEGER NOT NULL, status VARCHAR(20) DEFAULT 'pending', approved_by UUID REFERENCES users(id), approved_at TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE exchange_approvals (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), exchange_id UUID REFERENCES exchange_logs(id) NOT NULL, approver_id UUID REFERENCES users(id) NOT NULL, action VARCHAR(20) NOT NULL, comment TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE achievement_definitions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), type VARCHAR(50) NOT NULL UNIQUE, name VARCHAR(100) NOT NULL, description TEXT, condition_data JSONB NOT NULL DEFAULT '{}', reward_stars INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE user_achievements (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES users(id) NOT NULL, achievement_id UUID REFERENCES achievement_definitions(id) NOT NULL, progress INTEGER DEFAULT 0, unlocked_at TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, achievement_id))`);
    await pool.query(`CREATE TABLE refresh_tokens (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES users(id) NOT NULL, token_hash VARCHAR(255) NOT NULL, expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE INDEX idx_task_logs_user_date ON task_logs(user_id, completed_date)`);
    await pool.query(`CREATE INDEX idx_exchange_logs_user ON exchange_logs(user_id, status)`);
    await pool.query(`CREATE INDEX idx_tasks_family ON tasks(family_id)`);
    await pool.query(`CREATE INDEX idx_goals_family_user ON goals(family_id, user_id)`);
    await pool.query(`CREATE INDEX idx_users_family ON users(family_id)`);
    await pool.query(`CREATE INDEX idx_users_phone ON users(phone)`);
    await pool.query(`CREATE INDEX idx_family_code ON family(code)`);
    await pool.query(`INSERT INTO achievement_definitions (type, name, description, condition_data, reward_stars) VALUES ('task_count_10', '小试牛刀', '累计完成10个任务', '{"count": 10}', 5), ('task_count_50', '任务达人', '累计完成50个任务', '{"count": 50}', 15), ('task_count_100', '任务之王', '累计完成100个任务', '{"count": 100}', 30), ('star_total_50', '星星收藏家', '累计获得50颗星星', '{"count": 50}', 10), ('star_total_200', '星星富翁', '累计获得200颗星星', '{"count": 200}', 30), ('goal_completed_1', '初达成', '完成第1个目标', '{"count": 1}', 20), ('goal_completed_3', '目标达成者', '完成3个目标', '{"count": 3}', 50), ('level_5', '五级玩家', '达到5级', '{"level": 5}', 25), ('level_10', '十级玩家', '达到10级', '{"level": 10}', 50) ON CONFLICT (type) DO NOTHING`);
    console.log('Database v3.0 initialized!')
  } catch (err) {
    console.error('Error:', err)
    throw err
  } finally {
    await pool.end()
  }
}
initDb()
