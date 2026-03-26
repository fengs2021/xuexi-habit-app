-- =====================================================
-- 习惯养成 App 数据库设计 v3.4
-- 与代码完全一致
-- 最后更新: 2026-03-25
-- =====================================================

-- =====================================================
-- 更新日志
-- =====================================================
-- v3.4 (2026-03-25)
--   - 任务状态查询逻辑调整：
--     * 每日任务：以北京时间 00:00 为周期开始
--     * 每周任务：以北京时间周一 00:00 为周期开始
--     * 特殊任务(once)：不受周期限制
--   - 新增 API: /api/tasks/cycle-status (任务页面用)
--   - 保持 API: /api/tasks/student-status (审批页面用)
--
-- v3.3 (2026-03-24)
--   - 积分系统 v2：统一使用 points.js 服务
--   - 新增 point_logs 表记录所有积分变动
--   - 新增 point_transaction_types 表定义积分类型
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
    openid          VARCHAR(100) UNIQUE,
    nickname        VARCHAR(50) NOT NULL,
    avatar          VARCHAR(500) DEFAULT '',
    role            VARCHAR(20) DEFAULT 'child' CHECK (role IN ('admin', 'parent', 'child')),
    level           INTEGER DEFAULT 1,
    stars           INTEGER DEFAULT 0,
    total_stars     INTEGER DEFAULT 0,
    wish_points     INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加外键约束
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
    frequency       VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'special', 'once')),
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
    task_id         UUID REFERENCES tasks(id),
    action          VARCHAR(20) NOT NULL CHECK (action IN ('complete', 'skip', 'skipped', 'approved', 'rejected', 'punishment')),
    stars_earned    INTEGER DEFAULT 0,
    completed_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_status VARCHAR(20) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    task_type       VARCHAR(20) DEFAULT 'normal'
);

-- ---------------------------------------------------
-- 7. 兑换记录表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS exchange_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) NOT NULL,
    reward_id       UUID REFERENCES rewards(id) NOT NULL,
    stars_spent     INTEGER NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'approved', 'rejected')),
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
-- 12. 用户积分汇总表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS user_point_summary (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_earned    INTEGER DEFAULT 0,
    total_used      INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- 13. 签到记录表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS user_signins (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    sign_date       DATE NOT NULL,
    stars_earned    INTEGER DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_streak  INTEGER DEFAULT 0,
    longest_streak  INTEGER DEFAULT 0,
    bonus_stars     INTEGER DEFAULT 0,
    streak_days     INTEGER DEFAULT 0,
    UNIQUE(user_id, sign_date)
);

-- ---------------------------------------------------
-- 14. 贴纸定义表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS stickers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    emoji           VARCHAR(50) DEFAULT '⭐',
    rarity          VARCHAR(20) NOT NULL CHECK (rarity IN ('N', 'R', 'SR', 'SSR')),
    description     VARCHAR(500) DEFAULT '',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- 15. 用户贴纸表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS user_stickers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    sticker_id      UUID REFERENCES stickers(id) ON DELETE CASCADE,
    earned_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, sticker_id)
);

-- ---------------------------------------------------
-- 16. 用户宠物表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS user_pets (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    pet_type         VARCHAR(50) DEFAULT 'rabbit',
    pet_mood         VARCHAR(20) DEFAULT 'neutral',
    pet_level        INTEGER DEFAULT 1,
    hunger           INTEGER DEFAULT 100,
    cleanliness      INTEGER DEFAULT 100,
    mood             INTEGER DEFAULT 100,
    last_interaction TIMESTAMP,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- 17. 展示设置表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS user_display_settings (
    id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                  UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    equipped_stickers        UUID[] DEFAULT '{}',
    equipped_achievements    UUID[] DEFAULT '{}',
    theme_color              VARCHAR(20) DEFAULT 'pink',
    equipped_achievement_id  UUID,
    equipped_sticker_id      UUID,
    equipped_sticker1_id     UUID,
    equipped_sticker2_id     UUID,
    pet                      VARCHAR(50) DEFAULT 'rabbit',
    theme                    VARCHAR(20) DEFAULT 'pink',
    avatar_id                UUID,
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- 18. 转盘奖品表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS spin_wheel_prizes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    prize_type      VARCHAR(50) NOT NULL CHECK (prize_type IN ('stars', 'sticker', 'none')),
    prize_value     INTEGER DEFAULT 0,
    sticker_id      UUID REFERENCES stickers(id),
    weight          INTEGER DEFAULT 1,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    emoji           VARCHAR(50) DEFAULT '🎁'
);

-- ---------------------------------------------------
-- 19. 每日转盘记录表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS user_daily_spins (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    spin_date       DATE NOT NULL,
    spins_used      INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prize_id        UUID,
    prize_name      VARCHAR(100),
    UNIQUE(user_id, spin_date)
);

-- ---------------------------------------------------
-- 20. 周报表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start      DATE NOT NULL,
    week_end        DATE NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    stars_earned    INTEGER DEFAULT 0,
    tasks_detail    JSONB DEFAULT '{}',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data            JSONB DEFAULT '{}',
    viewed          BOOLEAN DEFAULT false,
    UNIQUE(user_id, week_start)
);

-- ---------------------------------------------------
-- 21. 头像表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS avatars (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(50) NOT NULL,
    filename        VARCHAR(100) NOT NULL,
    category        VARCHAR(30) DEFAULT 'cartoon',
    url             VARCHAR(255),
    is_active       BOOLEAN DEFAULT TRUE,
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
-- 预设成就定义 (28个)
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
    ('level_10', '十级玩家', '达到10级', '{"level": 10}', 50),
    ('sticker_count_10', '贴纸收集者', '收集10张贴纸', '{"count": 10}', 10),
    ('sticker_count_20', '贴纸达人', '收集20张贴纸', '{"count": 20}', 20),
    ('sticker_count_30', '贴纸收藏家', '收集30张贴纸', '{"count": 30}', 30),
    ('login_streak_3', '坚持3天', '连续登录3天', '{"days": 3}', 5),
    ('login_streak_7', '坚持一周', '连续登录7天', '{"days": 7}', 15),
    ('task_streak_3', '小坚持', '连续3天完成任务', '{"days": 3}', 10),
    ('task_streak_7', '坚持之星', '连续7天完成任务', '{"days": 7}', 25),
    ('exchange_count_1', '首次兑换', '完成首次奖励兑换', '{"count": 1}', 5),
    ('special_task_1', '特殊任务', '完成1个特殊任务', '{"count": 1}', 10),
    ('early_bird', '早起鸟', '在8点前完成任务', '{"hour": 8}', 15),
    ('night_owl', '夜猫子', '在22点后完成任务', '{"hour": 22}', 15),
    ('streak_task_7', '习惯养成', '单个任务连续完成7天', '{"days": 7}', 20),
    ('streak_task_15', '习惯达人', '单个任务连续完成15天', '{"days": 15}', 40),
    ('streak_task_30', '习惯大师', '单个任务连续完成30天', '{"days": 30}', 60),
    ('streak_task_60', '习惯传奇', '单个任务连续完成60天', '{"days": 60}', 100),
    ('count_task_10', '单项达人', '单个任务累计完成10次', '{"count": 10}', 15),
    ('count_task_30', '单项专家', '单个任务累计完成30次', '{"count": 30}', 30),
    ('count_task_60', '单项大师', '单个任务累计完成60次', '{"count": 60}', 50),
    ('count_task_100', '单项王者', '单个任务累计完成100次', '{"count": 100}', 80)
ON CONFLICT (type) DO NOTHING;

-- ---------------------------------------------------
-- 预设贴纸 (50个)
-- ---------------------------------------------------
INSERT INTO stickers (name, emoji, rarity, description) VALUES
    -- N级 (20个)
    ('小星星', '⭐', 'N', '完成任务获得'),
    ('小红花', '🌸', 'N', '漂亮的花朵'),
    ('小爱心', '❤️', 'N', '充满爱意'),
    ('小太阳', '☀️', 'N', '温暖明亮'),
    ('小月亮', '🌙', 'N', '夜晚的象征'),
    ('小云朵', '☁️', 'N', '轻盈飘逸'),
    ('小彩虹', '🌈', 'N', '美丽的彩虹'),
    ('小雪花', '❄️', 'N', '冬天的礼物'),
    ('小树叶', '🍃', 'N', '春天的气息'),
    ('小草莓', '🍓', 'N', '甜甜的草莓'),
    ('小西瓜', '🍉', 'N', '夏天的清凉'),
    ('小南瓜', '🎃', 'N', '万圣节'),
    ('小圣诞', '🎄', 'N', '圣诞节快乐'),
    ('小糖果', '🍬', 'N', '甜蜜的糖果'),
    ('小蛋糕', '🎂', 'N', '生日蛋糕'),
    ('小气球', '🎈', 'N', '派对必备'),
    ('小烟花', '🎆', 'N', '绚烂烟花'),
    ('小风车', '🌀', 'N', '旋转的风车'),
    ('小风铃', '🔔', 'N', '叮当响'),
    ('小雨伞', '☂️', 'N', '遮风挡雨'),
    -- R级 (10个)
    ('金色星星', '🌟', 'R', '闪亮的星星'),
    ('爱心盒子', '💝', 'R', '爱的礼物'),
    ('彩虹棒棒糖', '🍭', 'R', '甜甜的'),
    ('魔法棒', '🪄', 'R', '神奇的魔法'),
    ('小皇冠', '👑', 'R', '王者象征'),
    ('小天使', '👼', 'R', '可爱天使'),
    ('小精灵', '🧚', 'R', '森林精灵'),
    ('小海豚', '🐬', 'R', '聪明的海豚'),
    ('小独角兽', '🦄', 'R', '梦幻独角兽'),
    ('小彩虹', '🌈', 'R', '七彩彩虹'),
    -- SR级 (10个)
    ('小钻石', '💎', 'SR', '珍贵的宝石'),
    ('小皇冠', '🏆', 'SR', '胜利的象征'),
    ('小王冠', '👑', 'SR', '皇家风范'),
    ('小翅膀', '🪽', 'SR', '天使的翅膀'),
    ('小水晶', '🔮', 'SR', '神秘水晶'),
    ('小星星', '✨', 'SR', '闪耀星星'),
    ('小流星', '🌠', 'SR', '许愿流星'),
    ('小凤凰', '🦅', 'SR', '神鸟凤凰'),
    ('小金龙', '🐲', 'SR', '神龙现身'),
    ('小天使', '🧚', 'SR', '梦幻天使'),
    -- SSR级 (10个)
    ('传说宝石', '💠', 'SSR', '稀世珍宝'),
    ('彩虹水晶', '💠', 'SSR', '七彩水晶'),
    ('神圣之光', '💫', 'SSR', '神圣的光芒'),
    ('银河之心', '💫', 'SSR', '宇宙的奥秘'),
    ('创世之石', '💎', 'SSR', '开天辟地'),
    ('永恒星尘', '✨', 'SSR', '永恒的星光'),
    ('命运之轮', '🎡', 'SSR', '掌控命运'),
    ('神圣皇冠', '👑', 'SSR', '王者至尊'),
    ('宇宙之心', '🪐', 'SSR', '宇宙的核心'),
    ('永恒之龙', '🐉', 'SSR', '神龙再现')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------
-- 预设转盘奖品
-- ---------------------------------------------------
INSERT INTO spin_wheel_prizes (name, prize_type, prize_value, weight, emoji) VALUES
    ('谢谢参与', 'none', 0, 30, '😅'),
    ('1星', 'stars', 1, 25, '⭐'),
    ('2星', 'stars', 2, 20, '⭐'),
    ('3星', 'stars', 3, 12, '🌟'),
    ('5星', 'stars', 5, 8, '🌟'),
    ('N贴纸', 'sticker', 0, 3, '🎁'),
    ('R贴纸', 'sticker', 0, 1.5, '🎁'),
    ('SR贴纸', 'sticker', 0, 0.5, '🎁')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------
-- 预设头像 (20个)
-- ---------------------------------------------------
INSERT INTO avatars (name, filename, category) VALUES
    -- 卡通动物
    ('小兔子', 'rabbit.png', 'cartoon'),
    ('小狐狸', 'fox.png', 'cartoon'),
    ('小猫咪', 'cat.png', 'cartoon'),
    ('小狗狗', 'dog.png', 'cartoon'),
    ('小熊', 'bear.png', 'cartoon'),
    ('小熊猫', 'panda.png', 'cartoon'),
    ('小狮子', 'lion.png', 'cartoon'),
    ('小老虎', 'tiger.png', 'cartoon'),
    ('小象', 'elephant.png', 'cartoon'),
    ('小鹿', 'deer.png', 'cartoon'),
    -- 迪士尼
    ('米老鼠', 'mickey.png', 'disney'),
    ('小熊维尼', 'winnie.png', 'disney'),
    ('唐老鸭', 'donald.png', 'disney'),
    ('白雪公主', 'snow.png', 'disney'),
    ('爱莎公主', 'elsa.png', 'disney'),
    ('艾莎公主', 'elsa2.png', 'disney'),
    ('小美人鱼', 'mermaid.png', 'disney'),
    ('巴斯光年', 'buzz.png', 'disney'),
    ('蜘蛛侠', 'spider.png', 'disney'),
    ('钢铁侠', 'ironman.png', 'disney')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------
-- 数据库版本记录
-- ---------------------------------------------------
-- v3.0: 初始版本
-- v3.1: 添加 user_point_summary, user_display_settings 等表
-- v3.2: 修正 task_logs 表结构，添加 approval_status
-- v3.3: 修正 user_pets 表，添加 hunger/cleanliness/mood 字段
--       实现 updateGoal, deleteGoal, updateReward, deleteReward
--       修复 completeTask/skipTask 重复提交问题
--       修复 deductStars task_id FK 问题

-- =====================================================
-- 积分系统 v2.0 (2026-03-25)
-- =====================================================

-- ---------------------------------------------------
-- 22. 积分变动日志表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS point_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount          INTEGER NOT NULL,
    balance_after   INTEGER NOT NULL,
    type            VARCHAR(30) NOT NULL,
    source          VARCHAR(50) NOT NULL,
    source_id       UUID,
    description     VARCHAR(200),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_point_logs_user ON point_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_logs_source ON point_logs(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_logs_type ON point_logs(type, created_at DESC);

-- ---------------------------------------------------
-- 23. 积分类型定义表
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS point_transaction_types (
    type            VARCHAR(30) PRIMARY KEY,
    name            VARCHAR(50) NOT NULL,
    direction       VARCHAR(10) NOT NULL CHECK (direction IN ('earn', 'spend', 'neutral')),
    description     VARCHAR(200),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 预设积分类型
INSERT INTO point_transaction_types (type, name, direction, description) VALUES
    ('signin', '每日签到', 'earn', '每日签到获得的积分'),
    ('task_approve', '任务完成', 'earn', '完成任务并通过审批获得的积分'),
    ('achievement', '成就奖励', 'earn', '解锁成就获得的积分'),
    ('wheel', '转盘中奖', 'earn', '转盘抽奖获得的积分'),
    ('exchange', '兑换奖励', 'spend', '兑换奖励消耗的积分'),
    ('pet_care', '宠物照顾', 'spend', '照顾宠物消耗的积分'),
    ('deduct', '惩罚扣分', 'spend', '家长扣分惩罚消耗的积分'),
    ('adjust', '手动调整', 'neutral', '管理员手动调整'),
    ('reverse', '撤销返还', 'earn', '撤销审批后返还的积分')
ON CONFLICT (type) DO NOTHING;

-- ---------------------------------------------------
-- 24. users 表新增字段
-- ---------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_stars INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- ---------------------------------------------------
-- 积分校验视图
-- ---------------------------------------------------
CREATE OR REPLACE VIEW point_consistency_check AS
SELECT 
    u.id as user_id,
    u.nickname,
    u.stars as current_balance,
    u.total_stars as total_earned,
    COALESCE(
        (SELECT SUM(ABS(amount)) FROM point_logs WHERE user_id = u.id AND amount < 0), 
        0
    ) as total_spent,
    CASE 
        WHEN u.total_stars - u.stars = COALESCE(
            (SELECT SUM(ABS(amount)) FROM point_logs WHERE user_id = u.id AND amount < 0), 
            0
        ) THEN 'OK'
        ELSE 'INCONSISTENT'
    END as status
FROM users u
WHERE u.role = 'child';
