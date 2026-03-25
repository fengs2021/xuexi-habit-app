-- ============================================
-- 贴纸初始数据 - 通用池
-- ============================================

-- 通用池 N级 (普通)
INSERT INTO stickers (name, emoji, rarity, description, pool_type) VALUES
('小书本', '📖', 'N', '学习使我快乐', 'general'),
('小云朵', '☁️', 'N', '轻松一下', 'general'),
('小冰淇淋', '🍦', 'N', '凉爽一下', 'general'),
('小咖啡', '☕', 'N', '提提神', 'general'),
('小太阳', '☀️', 'N', '温暖的一天', 'general'),
('小彩虹', '🌈', 'N', '美丽的色彩', 'general'),
('小星星', '⭐', 'N', '完成任务的普通奖励', 'general'),
('小月亮', '🌙', 'N', '安静的夜晚', 'general'),
('小树叶', '🍃', 'N', '大自然的气息', 'general'),
('小水滴', '💧', 'N', '保持水分', 'general'),
('小火焰', '🔥', 'N', '小小的热情', 'general'),
('小糖果', '🍬', 'N', '小小的甜', 'general'),
('小红花', '🌸', 'N', '表现不错哦', 'general'),
('小苹果', '🍎', 'N', '健康之果', 'general'),
('小草莓', '🍓', 'N', '甜甜的味道', 'general'),
('小蛋糕', '🍰', 'N', '甜蜜时光', 'general'),
('小西瓜', '🍉', 'N', '夏日清凉', 'general'),
('小铅笔', '✏️', 'N', '认真作业', 'general'),
('小雪人', '⛄', 'N', '冬日可爱', 'general'),
('小饼干', '🍪', 'N', '酥脆可口', 'general');

-- 通用池 R级 (稀有)
INSERT INTO stickers (name, emoji, rarity, description, pool_type) VALUES
('安娜公主', '👸', 'R', '冰雪奇缘 Anna — 勇敢热情的公主', 'general'),
('棕色小熊', '🐻', 'R', '憨态可掬', 'general'),
('橙色狐狸', '🦊', 'R', '聪明伶俐', 'general'),
('灰色小猫', '🐱', 'R', '乖巧可爱', 'general'),
('白色兔子', '🐰', 'R', '蹦蹦跳跳', 'general'),
('粉色花朵', '🌺', 'R', '美丽的花', 'general'),
('紫色独角兽', '🦄', 'R', '梦幻般的', 'general'),
('紫色蜗牛', '🐌', 'R', '慢慢爬行', 'general'),
('红色龙', '🐉', 'R', '神秘威武', 'general'),
('绿色恐龙', '🦕', 'R', '远古来客', 'general'),
('绿色青蛙', '🐸', 'R', '跳跃高手', 'general'),
('蓝色海豚', '🐬', 'R', '聪明友好', 'general'),
('蓝色蝴蝶', '🦋', 'R', '翩翩起舞', 'general'),
('金色星星', '🌟', 'R', '闪闪发光', 'general'),
('黄色小鸡', '🐥', 'R', '活泼可爱', 'general'),
('黑白奶牛', '🐄', 'R', '哞哞叫', 'general'),
('学习勋章', '🎖', 'R', '学习小能手', 'general'),
('进步奖杯', '🏅', 'R', '每天进步一点', 'general'),
('阅读之星', '📚', 'R', '阅读小达人', 'general'),
('勤劳小蜂', '🐝', 'R', '勤劳的小蜜蜂', 'general'),
('时间达人', '⏰', 'R', '时间管理专家', 'general'),
('早起鸟', '🐦', 'R', '早起的鸟儿', 'general'),
('夜猫子', '🦉', 'R', '深夜学习', 'general'),
('小画家', '🎨', 'R', '创意小艺术家', 'general'),
('音乐盒', '🎵', 'R', '音乐小天才', 'general'),
('小厨神', '🍳', 'R', '厨房小帮手', 'general');

-- 通用池 SR级 (史诗)
INSERT INTO stickers (name, emoji, rarity, description, pool_type) VALUES
('彩虹独角兽', '🦄', 'SR', '传说生物', 'general'),
('彩虹翅膀', '🪽', 'SR', '天使之翼', 'general'),
('水晶球', '🔮', 'SR', '预示未来', 'general'),
('皇冠', '👑', 'SR', '至高荣誉', 'general'),
('金色凤凰', '🦅', 'SR', '涅槃重生', 'general'),
('金色太阳', '🌞', 'SR', '灿烂辉煌', 'general'),
('金色奖杯', '🏆', 'SR', '冠军之选', 'general'),
('钻石', '💎', 'SR', '珍贵稀有', 'general'),
('银色月亮', '🌕', 'SR', '皎洁月光', 'general'),
('魔法棒', '🪄', 'SR', '可以实现愿望', 'general');

-- 通用池 SSR级 (传说)
INSERT INTO stickers (name, emoji, rarity, description, pool_type) VALUES
('传奇神龙', '🐲', 'SSR', '传说中的存在', 'general'),
('宇宙之主', '🌌', 'SSR', '至高无上的存在', 'general'),
('宇宙之心', '💫', 'SSR', '掌控宇宙的力量', 'general'),
('永恒之星', '✨', 'SSR', '永恒不灭的光', 'general'),
('神圣天使', '👼', 'SSR', '最高守护', 'general');

-- ============================================
-- 贴纸初始数据 - 限定池（按周）
-- ============================================

-- 春季限定 (W13)
INSERT INTO stickers (name, emoji, rarity, description, pool_type, week_identifier) VALUES
('樱花精灵', '🌸', 'SR', '春季限定 - 浪漫樱花', 'limited', '2026-W13'),
('春日青蛙', '🐸', 'R', '春季限定 - 春日使者', 'limited', '2026-W13'),
('清明风筝', '🪁', 'SR', '春季限定 - 清明时节', 'limited', '2026-W13'),
('端午粽子', '🫔', 'R', '端午限定 - 传统美食', 'limited', '2026-W13'),
('端午龙舟', '🐲', 'SR', '端午限定 - 龙舟竞渡', 'limited', '2026-W13');

-- 夏季限定 (W14)
INSERT INTO stickers (name, emoji, rarity, description, pool_type, week_identifier) VALUES
('夏日西瓜', '🍉', 'R', '夏季限定 - 清凉一夏', 'limited', '2026-W14'),
('夏日萤火虫', '✨', 'SR', '夏季限定 - 浪漫夏夜', 'limited', '2026-W14'),
('冰淇淋车', '🚐', 'R', '夏季限定 - 甜蜜清凉', 'limited', '2026-W14'),
('游泳圈', '🏊', 'R', '夏季限定 - 戏水时光', 'limited', '2026-W14'),
('防晒霜', '🧴', 'N', '夏季限定 - 必备神器', 'limited', '2026-W14');

-- 秋季限定 (W15)
INSERT INTO stickers (name, emoji, rarity, description, pool_type, week_identifier) VALUES
('中秋月饼', '🥮', 'SR', '中秋限定 - 团圆佳节', 'limited', '2026-W15'),
('月饼兔子', '🐇', 'R', '中秋限定 - 玉兔捣药', 'limited', '2026-W15'),
('丰收南瓜', '🎃', 'R', '秋季限定 - 万圣节快乐', 'limited', '2026-W15'),
('感恩火鸡', '🦃', 'R', '秋季限定 - 感恩节', 'limited', '2026-W15'),
('落叶枫叶', '🍁', 'N', '秋季限定 - 金秋时节', 'limited', '2026-W15');

-- 冬季限定 (W16)
INSERT INTO stickers (name, emoji, rarity, description, pool_type, week_identifier) VALUES
('圣诞袜', '🧦', 'SR', '圣诞限定 - 惊喜礼物', 'limited', '2026-W16'),
('圣诞老人', '🎅', 'SR', '圣诞限定 - 欢乐圣诞', 'limited', '2026-W16'),
('雪人', '⛄', 'R', '冬季限定 - 冬日雪景', 'limited', '2026-W16'),
('热可可', '☕', 'N', '冬季限定 - 温暖心窝', 'limited', '2026-W16'),
('元旦烟花', '🎆', 'SSR', '新年限定 - 璀璨烟火', 'limited', '2026-W16');
