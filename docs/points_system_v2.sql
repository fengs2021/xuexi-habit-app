-- =====================================================
-- 积分系统数据库设计 v2.0
-- 统一积分管理，支持完整追溯
-- =====================================================

-- ---------------------------------------------------
-- 1. 积分变动日志表（核心追溯表）
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS point_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount          INTEGER NOT NULL,                    -- 变动数量（正数=获得，负数=消耗）
    balance_after   INTEGER NOT NULL,                    -- 变动后的余额
    type            VARCHAR(30) NOT NULL,                 -- 变动类型
    source          VARCHAR(50) NOT NULL,                 -- 来源模块
    source_id       UUID,                                -- 来源记录ID（如task_log_id, exchange_id等）
    description     VARCHAR(200),                         -- 变动描述
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE point_logs IS '积分变动日志，记录所有积分增减的完整流水';
COMMENT ON COLUMN point_logs.type IS '类型: earn(获得), spend(消耗), adjust(调整), reverse(撤销)';
COMMENT ON COLUMN point_logs.source IS '来源: signin, task, achievement, wheel, exchange, pet, deduct, reward';

-- 索引
CREATE INDEX IF NOT EXISTS idx_point_logs_user ON point_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_logs_source ON point_logs(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_logs_type ON point_logs(type, created_at DESC);

-- ---------------------------------------------------
-- 2. 修改 users 表（简化结构）
-- ---------------------------------------------------
-- users.stars: 当前可用余额（权威来源）
-- users.total_stars: 历史累计获得（冗余字段，用于快速查询）

ALTER TABLE users ADD COLUMN IF NOT EXISTS total_stars INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;  -- 用于乐观锁

-- ---------------------------------------------------
-- 3. 修改 user_point_summary 表（保留，用于统计分析）
-- ---------------------------------------------------
-- 这个表保留作为详细统计，可以从 point_logs 重建

-- ---------------------------------------------------
-- 4. 积分类型枚举表（可扩展）
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
-- 5. 积分校验视图（用于监控数据一致性）
-- ---------------------------------------------------
CREATE OR REPLACE VIEW point_consistency_check AS
SELECT 
    u.id as user_id,
    u.nickname,
    u.stars as current_balance,
    u.total_stars as total_earned,
    COALESCE(
        (SELECT SUM(amount) FROM point_logs WHERE user_id = u.id AND amount > 0), 
        0
    ) as logged_earned,
    COALESCE(
        (SELECT SUM(ABS(amount)) FROM point_logs WHERE user_id = u.id AND amount < 0), 
        0
    ) as logged_spent,
    COALESCE(
        (SELECT SUM(ABS(amount)) FROM point_logs WHERE user_id = u.id AND amount < 0), 
        0
    ) as logged_spent,
    u.total_stars - u.stars as calculated_spent,
    CASE 
        WHEN u.total_stars - u.stars = COALESCE(
            (SELECT SUM(ABS(amount)) FROM point_logs WHERE user_id = u.id AND amount < 0), 
            0
        ) THEN '✅ 一致'
        ELSE '❌ 不一致'
    END as status,
    u.total_stars - u.stars - COALESCE(
        (SELECT SUM(ABS(amount)) FROM point_logs WHERE user_id = u.id AND amount < 0), 
        0
    ) as difference
FROM users u
WHERE u.role = 'child';

-- ---------------------------------------------------
-- 6. 数据修复函数
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION fix_user_points(p_user_id UUID)
RETURNS TABLE(
    old_stars INTEGER,
    new_stars INTEGER,
    old_total_stars INTEGER,
    new_total_stars INTEGER,
    points_recovered INTEGER
) AS $$
DECLARE
    v_total_earned BIGINT;
    v_total_spent BIGINT;
    v_current_stars INTEGER;
BEGIN
    -- 计算 point_logs 中的总获得和总消耗
    SELECT COALESCE(SUM(amount), 0) INTO v_total_earned
    FROM point_logs 
    WHERE user_id = p_user_id AND amount > 0;
    
    SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_total_spent
    FROM point_logs 
    WHERE user_id = p_user_id AND amount < 0;
    
    -- 获取当前余额
    SELECT stars INTO v_current_stars FROM users WHERE id = p_user_id;
    
    -- 计算应该的余额
    new_stars := (v_total_earned - v_total_spent)::INTEGER;
    
    -- 记录修复前的值
    old_stars := v_current_stars;
    old_total_stars := v_total_earned::INTEGER;
    new_total_stars := v_total_earned::INTEGER;
    points_recovered := new_stars - v_current_stars;
    
    -- 更新用户表
    UPDATE users 
    SET stars = new_stars, 
        total_stars = v_total_earned::INTEGER,
        version = version + 1
    WHERE id = p_user_id;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
