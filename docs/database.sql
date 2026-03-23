-- =====================================================
-- 习惯养成 App 数据库设计 v3.0
-- 多家庭 · 多角色 · 家长审批
-- =====================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------
-- 1. 家庭表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS family (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL DEFAULT '我的家庭',
    code        VARCHAR(20) UNIQUE NOT NULL,
    owner_id    UUID,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- 2. 用户表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID REFERENCES family(id),
    phone           VARCHAR(20) UNIQUE,
    password_hash   VARCHAR(255),
    nickname        VARCHAR(50) NOT NULL,
    avatar          VARCHAR(500) DEFAULT '',
    role            VARCHAR(20) DEFAULT 'child' CHECK (role IN ('admin', 'parent', 'child')),
    level           INTEGER DEFAULT 1,
    stars           INTEGER DEFAULT 0,
    wish_points     INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加外键约束（在 users 创建后）
ALTER TABLE family ADD CONSTRAINT fk_family_owner FOREIGN KEY (owner_id) REFERENCES users(id);

-- ---------------------------------------------------
-- 3. 目标表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS goals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID REFERENCES family(id) NOT NULL,
    user_id         UUID REFERENCES users(id),
    title           VARCHAR(100) NOT NULL,
    icon            VARCHAR(50) DEFAULT 'star',
    difficulty      INTEGER DEFAULT 10,
    star_target     INTEGER DEFAULT 10,
    current_stars   INTEGER DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- 4. 任务表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID REFERENCES family(id) NOT NULL,
    goal_id         UUID REFERENCES goals(id),
    title           VARCHAR(100) NOT NULL,
    icon            VARCHAR(50) DEFAULT 'todo-o',
    star_reward     INTEGER DEFAULT 1,
    rarity          VARCHAR(20) DEFAULT 'N' CHECK (rarity IN ('N', 'R', 'SR', 'SSR')),
    frequency       VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
    frequency_count INTEGER DEFAULT 1,
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    last_reset_date DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- 5. 奖励表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS rewards (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id   UUID REFERENCES family(id) NOT NULL,
    title       VARCHAR(100) NOT NULL,
    icon        VARCHAR(50) DEFAULT 'gift',
    star_cost   INTEGER NOT NULL,
    rarity      VARCHAR(20) DEFAULT 'normal' CHECK (rarity IN ('normal', 'epic', 'legend')),
    is_active   BOOLEAN DEFAULT TRUE,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- 6. 任务记录表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS task_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) NOT NULL,
    task_id         UUID REFERENCES tasks(id) NOT NULL,
    action          VARCHAR(20) NOT NULL CHECK (action IN ('complete', 'skip')),
    stars_earned    INTEGER DEFAULT 0,
    completed_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- 7. 兑换记录表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS exchange_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) NOT NULL,
    reward_id       UUID REFERENCES rewards(id) NOT NULL,
    stars_spent     INTEGER NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- 8. 兑换审批表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS exchange_approvals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exchange_id     UUID REFERENCES exchange_logs(id) NOT NULL,
    approver_id     UUID REFERENCES users(id) NOT NULL,
    action          VARCHAR(20) NOT NULL CHECK (action IN ('approve', 'reject')),
    comment         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- 9. 成就定义表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS achievement_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    condition_data  JSONB NOT NULL DEFAULT '{}',
    reward_stars    INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- 10. 用户成就表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS user_achievements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) NOT NULL,
    achievement_id  UUID REFERENCES achievement_definitions(id) NOT NULL,
    progress        INTEGER DEFAULT 0,
    unlocked_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- ---------------------------------------------------
-- 11. Refresh Token 表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) NOT NULL,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- 索引
-- ---------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_task_logs_user_date ON task_logs(user_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_exchange_logs_user ON exchange_logs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_family ON tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_goals_family_user ON goals(family_id, user_id);
CREATE INDEX IF NOT EXISTS idx_users_family ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_family_code ON family(code);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ---------------------------------------------------
-- 预设成就定义
-- ---------------------------------------------------
INSERT INTO achievement_definitions (type, name, description, condition_data, reward_stars) VALUES
    ('task_count_10', '小试牛刀', '累计完成10个任务', '{"count": 10}', 5),
    ('task_count_50', '任务达人', '累计完成50个任务', '{"count": 50}', 15),
    ('task_count_100', '任务之王', '累计完成100个任务', '{"count": 100}', 30),
    ('star_total_50', '星星收藏家', '累计获得50颗星星', '{"count": 50}', 10),
    ('star_total_200', '星星富翁', '累计获得200颗星星', '{"count": 200}', 30),
    ('goal_completed_1', '初达成', '完成第1个目标', '{"count": 1}', 20),
    ('goal_completed_3', '目标达成者', '完成3个目标', '{"count": 3}', 50),
    ('level_5', '五级玩家', '达到5级', '{"level": 5}', 25),
    ('level_10', '十级玩家', '达到10级', '{"level": 10}', 50)
ON CONFLICT (type) DO NOTHING;

-- =============================================
-- v1.2.0 新增/修改表
-- =============================================

-- 补全签到表字段
ALTER TABLE user_signins ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE user_signins ADD COLUMN IF NOT EXISTS bonus_stars INTEGER DEFAULT 0;

-- 补全用户积分汇总表（v1.1.2）
CREATE TABLE IF NOT EXISTS user_point_summary (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_earned INTEGER DEFAULT 0,
    total_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 补全展示设置表字段
ALTER TABLE user_display_settings ADD COLUMN IF NOT EXISTS equipped_achievement_id UUID;
ALTER TABLE user_display_settings ADD COLUMN IF NOT EXISTS equipped_sticker_id UUID;
ALTER TABLE user_display_settings ADD COLUMN IF NOT EXISTS equipped_sticker1_id UUID;
ALTER TABLE user_display_settings ADD COLUMN IF NOT EXISTS equipped_sticker2_id UUID;
ALTER TABLE user_display_settings ADD COLUMN IF NOT EXISTS pet VARCHAR(50) DEFAULT 'rabbit';
ALTER TABLE user_display_settings ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'pink';

-- 补全转盘奖品表
ALTER TABLE spin_wheel_prizes ADD COLUMN IF NOT EXISTS emoji VARCHAR(50) DEFAULT '🎁';

-- 补全每日转盘记录表
ALTER TABLE user_daily_spins ADD COLUMN IF NOT EXISTS prize_id UUID;
ALTER TABLE user_daily_spins ADD COLUMN IF NOT EXISTS prize_name VARCHAR(100);

-- 补全周报表
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS viewed BOOLEAN DEFAULT false;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';

-- 修改任务frequency约束（支持once一次性任务）
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_frequency_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_frequency_check CHECK (frequency IN ('daily', 'weekly', 'special', 'once'));

-- 初始化用户积分汇总
INSERT INTO user_point_summary (user_id, total_earned, total_used)
SELECT id, 0, 0 FROM users
ON CONFLICT (user_id) DO NOTHING;

-- 初始化用户宠物
INSERT INTO user_pets (user_id, pet_type, pet_mood)
SELECT id, 'rabbit', 'neutral' FROM users
ON CONFLICT (user_id) DO NOTHING;
