-- ============================================
-- 学习记录功能数据库表
-- ============================================
-- 执行方式: psql -U postgres -d xuexi -f study-schema.sql
-- ============================================

BEGIN;

-- ============================================
-- 1. 科目表
-- ============================================
CREATE TABLE IF NOT EXISTS study_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES family(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(20) DEFAULT '📚',
    color VARCHAR(20) DEFAULT '#4A90D9',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(family_id, name)
);

COMMENT ON TABLE study_subjects IS '学习科目表';
COMMENT ON COLUMN study_subjects.name IS '科目名称：语文、数学、英语';
COMMENT ON COLUMN study_subjects.icon IS 'emoji图标';
COMMENT ON COLUMN study_subjects.color IS '主题色';

-- ============================================
-- 2. 学习记录表
-- ============================================
CREATE TABLE IF NOT EXISTS study_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES study_subjects(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    photos JSONB DEFAULT '[]',
    notes TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE study_records IS '学习记录表';
COMMENT ON COLUMN study_records.photos IS '试卷照片路径数组';
COMMENT ON COLUMN study_records.status IS 'draft=待审核, approved=已审核';
COMMENT ON COLUMN study_records.notes IS '家长备注';

CREATE INDEX IF NOT EXISTS idx_study_records_user_date ON study_records(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_study_records_subject ON study_records(subject_id);

-- ============================================
-- 3. 题目表
-- ============================================
CREATE TABLE IF NOT EXISTS study_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES study_subjects(id) ON DELETE CASCADE,
    record_id UUID REFERENCES study_records(id) ON DELETE SET NULL,
    question_no VARCHAR(20) NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('choice', 'truefalse', 'fill', 'blank', 'application')),
    content TEXT NOT NULL,
    options JSONB,
    ai_answer TEXT,
    correct_answer TEXT,
    answer_image VARCHAR(500),
    parent_reviewed BOOLEAN DEFAULT false,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    times_asked INT DEFAULT 0,
    times_correct INT DEFAULT 0,
    source VARCHAR(20) DEFAULT 'photo' CHECK (source IN ('photo', 'manual')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE study_questions IS '试题库表';
COMMENT ON COLUMN study_questions.question_type IS 'choice=选择, truefalse=判断, fill=填空, blank=简答, application=应用';
COMMENT ON COLUMN study_questions.options IS '选择题选项 [{"label":"A","text":"..."}]';
COMMENT ON COLUMN study_questions.difficulty IS 'easy/medium/hard';

CREATE INDEX IF NOT EXISTS idx_study_questions_subject ON study_questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_questions_record ON study_questions(record_id);
CREATE INDEX IF NOT EXISTS idx_study_questions_type ON study_questions(question_type);

-- ============================================
-- 4. 错题本表
-- ============================================
CREATE TABLE IF NOT EXISTS study_wrong_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES study_questions(id) ON DELETE CASCADE,
    times_wrong INT DEFAULT 1,
    times_reviewed INT DEFAULT 0,
    mastered BOOLEAN DEFAULT false,
    last_reviewed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

COMMENT ON TABLE study_wrong_questions IS '错题本表';
COMMENT ON COLUMN study_wrong_questions.mastered IS '是否已掌握，连续答对3次后设为true';

CREATE INDEX IF NOT EXISTS idx_study_wrong_user ON study_wrong_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_wrong_mastered ON study_wrong_questions(user_id, mastered);

-- ============================================
-- 5. 练习记录表
-- ============================================
CREATE TABLE IF NOT EXISTS study_practice_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES study_subjects(id) ON DELETE CASCADE,
    mode VARCHAR(20) DEFAULT 'all' CHECK (mode IN ('all', 'wrong')),
    question_ids JSONB NOT NULL,
    answers JSONB NOT NULL,
    results JSONB NOT NULL,
    score INT,
    practiced_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE study_practice_logs IS '练习记录表';
COMMENT ON COLUMN study_practice_logs.mode IS 'all=全部题库, wrong=错题本';
COMMENT ON COLUMN study_practice_logs.question_ids IS '本次练习的题目ID数组';
COMMENT ON COLUMN study_practice_logs.answers IS '孩子提交的答案 {question_id: answer}';
COMMENT ON COLUMN study_practice_logs.results IS '判定结果 {question_id: true/false}';

CREATE INDEX IF NOT EXISTS idx_study_practice_user ON study_practice_logs(user_id, practiced_at);
CREATE INDEX IF NOT EXISTS idx_study_practice_subject ON study_practice_logs(subject_id);

-- ============================================
-- 6. 复习记录表
-- ============================================
CREATE TABLE IF NOT EXISTS study_review_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES study_questions(id) ON DELETE CASCADE,
    result VARCHAR(20) NOT NULL CHECK (result IN ('correct', 'wrong')),
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE study_review_logs IS '复习记录表';

CREATE INDEX IF NOT EXISTS idx_study_review_user ON study_review_logs(user_id, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_study_review_question ON study_review_logs(question_id);

COMMIT;

-- ============================================
-- 验证
-- ============================================
SELECT 'study_subjects' as table_name, COUNT(*) as row_count FROM study_subjects
UNION ALL SELECT 'study_records', COUNT(*) FROM study_records
UNION ALL SELECT 'study_questions', COUNT(*) FROM study_questions
UNION ALL SELECT 'study_wrong_questions', COUNT(*) FROM study_wrong_questions
UNION ALL SELECT 'study_practice_logs', COUNT(*) FROM study_practice_logs
UNION ALL SELECT 'study_review_logs', COUNT(*) FROM study_review_logs;
