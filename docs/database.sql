-- ============================================
-- 习惯养成 App - 数据库设计
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 家庭表
-- ============================================
CREATE TABLE IF NOT EXISTS family (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL DEFAULT '我的家庭',
    code          VARCHAR(20) UNIQUE NOT NULL,  -- 邀请码
    owner_id      UUID,                          -- 家长用户 ID
    device_id     VARCHAR(100),                  -- 设备标识
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id     UUID REFERENCES family(id),
    openid        VARCHAR(100) UNIQUE,           -- 微信 openid（可选）
    nickname      VARCHAR(50) NOT NULL,
    avatar        VARCHAR(500) DEFAULT '',       -- 头像 URL
    role          VARCHAR(20) DEFAULT 'child',   -- parent / child
    level         INTEGER DEFAULT 1,
    stars         INTEGER DEFAULT 0,             -- 当前星星数
    wish_points   INTEGER DEFAULT 0,             -- 愿望值
    is_current    BOOLEAN DEFAULT FALSE,         -- 当前选中的孩子
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加外键约束（家庭拥有者）
ALTER TABLE family ADD CONSTRAINT fk_family_owner 
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- 目标表
-- ============================================
CREATE TABLE IF NOT EXISTS goals (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id     UUID REFERENCES family(id) NOT NULL,
    user_id       UUID REFERENCES users(id),     -- 指定用户（null=通用）
    title         VARCHAR(100) NOT NULL,         -- 目标名称
    icon          VARCHAR(50) DEFAULT 'star',     -- 图标
    difficulty    INTEGER DEFAULT 10,            -- 愿望值难度 10/50/100
    star_target   INTEGER DEFAULT 10,            -- 需要达成的星星数
    current_stars INTEGER DEFAULT 0,              -- 当前累计星星
    status        VARCHAR(20) DEFAULT 'active',  -- active/completed/abandoned
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 任务表
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id     UUID REFERENCES family(id) NOT NULL,
    goal_id       UUID REFERENCES goals(id),     -- 关联目标（可选）
    title         VARCHAR(100) NOT NULL,
    icon          VARCHAR(50) DEFAULT 'task',
    star_reward   INTEGER DEFAULT 1,             -- 完成奖励星星
    rarity        VARCHAR(20) DEFAULT 'N',       -- N/R/SR/SSR
    frequency     VARCHAR(20) DEFAULT 'daily',    -- daily/weekly
    frequency_count INTEGER DEFAULT 1,            -- 每日/每周次数
    is_active     BOOLEAN DEFAULT TRUE,
    sort_order    INTEGER DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 奖励表
-- ============================================
CREATE TABLE IF NOT EXISTS rewards (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id     UUID REFERENCES family(id) NOT NULL,
    title         VARCHAR(100) NOT NULL,
    icon          VARCHAR(50) DEFAULT 'gift',
    star_cost     INTEGER NOT NULL,
    rarity        VARCHAR(20) DEFAULT 'normal',  -- normal/epic/legend
    is_active     BOOLEAN DEFAULT TRUE,
    sort_order    INTEGER DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 任务记录表
-- ============================================
CREATE TABLE IF NOT EXISTS task_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES users(id) NOT NULL,
    task_id       UUID REFERENCES tasks(id) NOT NULL,
    action        VARCHAR(20) NOT NULL,          -- complete / skip
    stars_earned  INTEGER DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 兑换记录表
-- ============================================
CREATE TABLE IF NOT EXISTS exchange_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES users(id) NOT NULL,
    reward_id     UUID REFERENCES rewards(id) NOT NULL,
    stars_spent   INTEGER NOT NULL,
    status        VARCHAR(20) DEFAULT 'pending', -- pending/completed/cancelled
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 成就表
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES users(id) NOT NULL,
    type          VARCHAR(50) NOT NULL,          -- goal_completed/task_count/streak
    title         VARCHAR(100),
    count         INTEGER DEFAULT 0,
    unlocked_at   TIMESTAMP,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_family ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_goals_family ON goals(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_family ON tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_rewards_family ON rewards(family_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_user ON task_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_logs_user ON exchange_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_created ON task_logs(created_at);

-- ============================================
-- 触发器：自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_family_updated_at BEFORE UPDATE ON family
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
