-- ============================================
-- 成就初始数据
-- ============================================

INSERT INTO achievement_definitions (type, name, description, condition_data, reward_stars) VALUES

-- ========== 任务数量成就 ==========
('task_count_10', '锋芒初现', '累计完成10个任务', '{"type":"task_count","value":10}', 5),
('task_count_50', '任务大师', '累计完成50个任务', '{"type":"task_count","value":50}', 15),
('task_count_100', '千任务霸者', '累计完成100个任务', '{"type":"task_count","value":100}', 50),

-- ========== 连续任务成就 ==========
('task_streak_3', '习惯初成', '连续3天完成任务', '{"type":"task_streak","value":3}', 5),
('task_streak_7', '习惯铸造师', '连续7天完成任务', '{"type":"task_streak","value":7}', 15),

-- ========== 单任务连续成就 ==========
('streak_task_7', '专注新星', '同一任务连续完成7天', '{"type":"streak_task","value":7}', 10),
('streak_task_15', '专注大师', '同一任务连续完成15天', '{"type":"streak_task","value":15}', 25),
('streak_task_30', '专注传奇', '同一任务连续完成30天', '{"type":"streak_task","value":30}', 50),
('streak_task_60', '永恒守护者', '同一任务连续完成60天', '{"type":"streak_task","value":60}', 100),

-- ========== 单任务累计成就 ==========
('count_task_10', '重复执行者', '同一任务累计完成10次', '{"type":"count_task","value":10}', 5),
('count_task_30', '资深执行者', '同一任务累计完成30次', '{"type":"count_task","value":30}', 15),
('count_task_60', '任务传奇', '同一任务累计完成60次', '{"type":"count_task","value":60}', 30),
('count_task_100', '神级执行者', '同一任务累计完成100次', '{"type":"count_task","value":100}', 60),

-- ========== 星星成就 ==========
('star_total_50', '星辉学徒', '累计获得50颗星星', '{"type":"star_total","value":50}', 10),
('star_total_200', '星河贵族', '累计获得200颗星星', '{"type":"star_total","value":200}', 35),

-- ========== 等级成就 ==========
('level_5', '五星冒险家', '冒险等级达到5级', '{"type":"level","value":5}', 25),
('level_10', '十星传奇', '冒险等级达到10级', '{"type":"level","value":10}', 60),

-- ========== 目标成就 ==========
('goal_completed_1', '目标猎人', '完成第1个目标', '{"type":"goal_completed","value":1}', 15),
('goal_completed_3', '目标大师', '完成3个目标', '{"type":"goal_completed","value":3}', 40),

-- ========== 贴纸成就 ==========
('sticker_count_10', '集邮小兵', '收集10张贴纸', '{"type":"sticker_count","value":10}', 3),
('sticker_count_20', '收藏新星', '收集20张贴纸', '{"type":"sticker_count","value":20}', 8),
('sticker_count_30', '收藏大师', '收集30张贴纸', '{"type":"sticker_count","value":30}', 18),

-- ========== 连续登录成就 ==========
('login_streak_3', '忠实冒险者', '连续登录3天', '{"type":"login_streak","value":3}', 5),
('login_streak_7', '永不懈怠', '连续登录7天', '{"type":"login_streak","value":7}', 15),

-- ========== 特殊成就 ==========
('exchange_count_1', '首次交易', '完成首次奖励兑换', '{"type":"exchange_count","value":1}', 3),
('special_task_1', '神秘挑战者', '完成1个特殊任务', '{"type":"special_task","value":1}', 8),
('early_bird', '黎明猎手', '在早上8点前完成任务', '{"type":"early_bird","value":0}', 3),
('night_owl', '暗夜猎手', '在晚上10点后完成任务', '{"type":"night_owl","value":0}', 3),

-- ========== 速度成就 ==========
('speed_task_5', '闪电侠', '在任务出现后5分钟内完成', '{"type":"speed_task","value":5}', 10),
('speed_task_10', '疾风侠', '在任务出现后10分钟内完成', '{"type":"speed_task","value":10}', 8),

-- ========== 完美成就 ==========
('perfect_day', '完美一天', '一天内完成所有每日任务', '{"type":"perfect_day","value":0}', 15),
('perfect_week', '完美周', '一周7天每天都完成任务', '{"type":"perfect_week","value":0}', 50),

-- ========== 早起成就 ==========
('early_6', '晨曦勇者', '早上6点前完成任务', '{"type":"early_6","value":0}', 10),
('early_7', '破晓骑士', '早上7点前完成任务', '{"type":"early_7","value":0}', 8),

-- ========== 深夜成就 ==========
('night_21', '子夜刺客', '晚上9点后完成任务', '{"type":"night_21","value":0}', 8),
('night_23', '午夜使者', '晚上11点后完成任务', '{"type":"night_23","value":0}', 10),

-- ========== 全能成就 ==========
('all_frequency', '全能选手', '三种频率任务都完成过', '{"type":"all_frequency","value":0}', 15),

-- ========== 周末成就 ==========
('weekend_warrior', '周末战士', '在周六和周日都完成任务', '{"type":"weekend_warrior","value":0}', 15),
('sunday_warrior', '周日战神', '连续3个周日完成任务', '{"type":"sunday_warrior","value":3}', 20),

-- ========== 单日爆发成就 ==========
('day_star_10', '星星炸弹', '单日获得10颗星', '{"type":"day_star","value":10}', 15),
('day_task_5', '任务狂人', '单日完成5个任务', '{"type":"day_task","value":5}', 20),

-- ========== 首次成就 ==========
('first_task', '初次冒险', '完成第一个任务', '{"type":"first_task","value":0}', 5),
('first_star', '星星初现', '获得第一颗星', '{"type":"first_star","value":0}', 3),
('first_goal', '目标启程', '设定第一个目标', '{"type":"first_goal","value":0}', 5),

-- ========== 坚持成就 ==========
('monthly_streak', '月度守护', '连续30天登录', '{"type":"monthly_streak","value":30}', 40),
('century_streak', '百日英雄', '连续100天登录', '{"type":"century_streak","value":100}', 80),

-- ========== 家庭成就 ==========
('family_helper', '家庭英雄', '帮助家人完成任务', '{"type":"family_helper","value":0}', 10),
('family_star_100', '家族荣耀', '家庭累计获得100颗星', '{"type":"family_star","value":100}', 25),

-- ========== 回归成就 ==========
('comeback', '绝地反击', '中断后重新连续7天完成任务', '{"type":"comeback","value":7}', 30),
('never_give_up', '永不言弃', '中断后重新连续30天完成任务', '{"type":"never_give_up","value":30}', 60);
