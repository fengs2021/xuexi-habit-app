import pool from '../config/database.js'
import { success, error, ErrorCodes } from '../utils/response.js'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../utils/jwt.js'
import { visionAnalyze } from '../utils/minimax.js'

// 获取当前用户
async function getUserFromToken(ctx) {
  const authHeader = ctx.headers.authorization
  if (!authHeader) {
    ctx.body = error(ErrorCodes.NOT_LOGIN, '未登录')
    return null
  }
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)
    const userResult = await pool.query(
      'SELECT u.*, f.name as family_name FROM users u LEFT JOIN family f ON u.family_id = f.id WHERE u.id = $1',
      [decoded.id]
    )
    if (userResult.rows.length === 0) {
      ctx.body = error(404, '用户不存在')
      return null
    }
    return userResult.rows[0]
  } catch (err) {
    ctx.body = error(401, '无效的token')
    return null
  }
}

// ========== 科目管理 ==========

// 获取科目列表
export async function getSubjects(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  try {
    const result = await pool.query(
      `SELECT id, name, icon, color, sort_order, is_active, created_at
       FROM study_subjects
       WHERE family_id = $1 AND is_active = true
       ORDER BY sort_order, created_at`,
      [user.family_id]
    )
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetSubjects error:', err)
    ctx.body = error(500, '获取科目列表失败')
  }
}

// 创建科目
export async function createSubject(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '只有家长可以创建科目')
    return
  }
  
  const { name, icon = '📚', color = '#4A90D9' } = ctx.request.body
  
  if (!name || name.trim() === '') {
    ctx.body = error(400, '科目名称不能为空')
    return
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO study_subjects (family_id, name, icon, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.family_id, name.trim(), icon, color]
    )
    ctx.body = success(result.rows[0])
  } catch (err) {
    if (err.code === '23505') {
      ctx.body = error(400, '科目已存在')
      return
    }
    console.error('CreateSubject error:', err)
    ctx.body = error(500, '创建科目失败')
  }
}

// 更新科目
export async function updateSubject(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '只有家长可以更新科目')
    return
  }
  
  const { id } = ctx.params
  const { name, icon, color, sort_order, is_active } = ctx.request.body
  
  try {
    const updates = []
    const values = []
    let idx = 1
    
    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name.trim()) }
    if (icon !== undefined) { updates.push(`icon = $${idx++}`); values.push(icon) }
    if (color !== undefined) { updates.push(`color = $${idx++}`); values.push(color) }
    if (sort_order !== undefined) { updates.push(`sort_order = $${idx++}`); values.push(sort_order) }
    if (is_active !== undefined) { updates.push(`is_active = $${idx++}`); values.push(is_active) }
    
    if (updates.length === 0) {
      ctx.body = error(400, '没有要更新的字段')
      return
    }
    
    values.push(id, user.family_id)
    const result = await pool.query(
      `UPDATE study_subjects SET ${updates.join(', ')}
       WHERE id = $${idx++} AND family_id = $${idx}
       RETURNING *`,
      values
    )
    
    if (result.rows.length === 0) {
      ctx.body = error(404, '科目不存在')
      return
    }
    
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('UpdateSubject error:', err)
    ctx.body = error(500, '更新科目失败')
  }
}

// 删除科目（软删除）
export async function deleteSubject(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '只有家长可以删除科目')
    return
  }
  
  const { id } = ctx.params
  
  try {
    const result = await pool.query(
      `UPDATE study_subjects SET is_active = false
       WHERE id = $1 AND family_id = $2
       RETURNING *`,
      [id, user.family_id]
    )
    
    if (result.rows.length === 0) {
      ctx.body = error(404, '科目不存在')
      return
    }
    
    ctx.body = success({ message: '删除成功' })
  } catch (err) {
    console.error('DeleteSubject error:', err)
    ctx.body = error(500, '删除科目失败')
  }
}

// ========== 学习记录 ==========

// 获取学习记录列表
export async function getRecords(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { subject_id, date, user_id, page = 1, limit = 20 } = ctx.query
  const offset = (parseInt(page) - 1) * parseInt(limit)
  
  try {
    let where = 'WHERE ss.family_id = $1'
    const values = [user.family_id]
    let idx = 2
    
    // 家长可以看所有记录，孩子只看自己的
    if (user.role === 'child') {
      where += ` AND sr.user_id = $${idx++}`
      values.push(user.id)
    } else if (user_id) {
      where += ` AND sr.user_id = $${idx++}`
      values.push(user_id)
    }
    
    if (subject_id) {
      where += ` AND sr.subject_id = $${idx++}`
      values.push(subject_id)
    }
    
    if (date) {
      where += ` AND sr.record_date = $${idx++}`
      values.push(date)
    }
    
    values.push(parseInt(limit), offset)
    
    const result = await pool.query(
      `SELECT sr.id, sr.user_id, sr.subject_id, sr.record_date, sr.photos,
              sr.notes, sr.status, sr.created_at,
              ss.name as subject_name, ss.icon as subject_icon, ss.color as subject_color,
              u.nickname as user_nickname,
              (SELECT COUNT(*) FROM study_questions sq WHERE sq.record_id = sr.id) as question_count
       FROM study_records sr
       JOIN study_subjects ss ON sr.subject_id = ss.id
       JOIN users u ON sr.user_id = u.id
       ${where}
       ORDER BY sr.record_date DESC, sr.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    )
    
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetRecords error:', err)
    ctx.body = error(500, '获取学习记录失败')
  }
}

// 获取单条学习记录
export async function getRecord(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  
  try {
    const result = await pool.query(
      `SELECT sr.id, sr.user_id, sr.subject_id, sr.record_date, sr.photos,
              sr.notes, sr.status, sr.created_at, sr.updated_at,
              ss.name as subject_name, ss.icon as subject_icon, ss.color as subject_color,
              u.nickname as user_nickname,
              (SELECT COUNT(*) FROM study_questions sq WHERE sq.record_id = sr.id) as question_count
       FROM study_records sr
       JOIN study_subjects ss ON sr.subject_id = ss.id
       JOIN users u ON sr.user_id = u.id
       WHERE sr.id = $1 AND sr.family_id = $2`,
      [id, user.family_id]
    )
    
    if (result.rows.length === 0) {
      ctx.body = error(404, '学习记录不存在')
      return
    }
    
    // 获取关联的题目
    const questions = await pool.query(
      `SELECT id, question_no, question_type, content, options, ai_answer,
              correct_answer, parent_reviewed, difficulty, source, created_at
       FROM study_questions
       WHERE record_id = $1
       ORDER BY question_no`,
      [id]
    )
    
    const record = result.rows[0]
    record.questions = questions.rows
    ctx.body = success(record)
  } catch (err) {
    console.error('GetRecord error:', err)
    ctx.body = error(500, '获取学习记录失败')
  }
}

// 创建学习记录
export async function createRecord(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '只有家长可以创建学习记录')
    return
  }
  
  const { subject_id, record_date, photos = [], notes } = ctx.request.body
  
  if (!subject_id) {
    ctx.body = error(400, '请选择科目')
    return
  }
  
  // 验证科目属于该家庭
  const subjectCheck = await pool.query(
    'SELECT id FROM study_subjects WHERE id = $1 AND family_id = $2 AND is_active = true',
    [subject_id, user.family_id]
  )
  if (subjectCheck.rows.length === 0) {
    ctx.body = error(404, '科目不存在')
    return
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO study_records (user_id, subject_id, record_date, photos, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user.id, subject_id, record_date || new Date().toISOString().split('T')[0], JSON.stringify(photos), notes]
    )
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('CreateRecord error:', err)
    ctx.body = error(500, '创建学习记录失败')
  }
}

// 更新学习记录
export async function updateRecord(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '只有家长可以更新学习记录')
    return
  }
  
  const { id } = ctx.params
  const { photos, notes, status } = ctx.request.body
  
  try {
    const updates = []
    const values = []
    let idx = 1
    
    if (photos !== undefined) { updates.push(`photos = $${idx++}`); values.push(JSON.stringify(photos)) }
    if (notes !== undefined) { updates.push(`notes = $${idx++}`); values.push(notes) }
    if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status) }
    updates.push(`updated_at = NOW()`)
    
    if (updates.length === 1) {
      ctx.body = error(400, '没有要更新的字段')
      return
    }
    
    values.push(id, user.family_id)
    const result = await pool.query(
      `UPDATE study_records SET ${updates.join(', ')}
       WHERE id = $${idx++} AND family_id = $${idx}
       RETURNING *`,
      values
    )
    
    if (result.rows.length === 0) {
      ctx.body = error(404, '学习记录不存在')
      return
    }
    
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('UpdateRecord error:', err)
    ctx.body = error(500, '更新学习记录失败')
  }
}

// 删除学习记录
export async function deleteRecord(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '只有家长可以删除学习记录')
    return
  }
  
  const { id } = ctx.params
  
  try {
    const result = await pool.query(
      `DELETE FROM study_records WHERE id = $1 AND family_id = $2 RETURNING id`,
      [id, user.family_id]
    )
    
    if (result.rows.length === 0) {
      ctx.body = error(404, '学习记录不存在')
      return
    }
    
    ctx.body = success({ message: '删除成功' })
  } catch (err) {
    console.error('DeleteRecord error:', err)
    ctx.body = error(500, '删除学习记录失败')
  }
}

// ========== OCR 识别 ==========

export async function ocrIdentify(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '只有家长可以使用OCR识别')
    return
  }
  
  const { subject_id, photos } = ctx.request.body
  
  if (!photos || photos.length === 0) {
    ctx.body = error(ErrorCodes.PARAM_ERROR, '请提供试卷照片')
    return
  }
  
  try {
    // 构建 OCR prompt
    const prompt = `请分析这张试卷图片，识别出所有题目并返回JSON格式。

要求：
1. 返回JSON数组，每项包含：question_no(题号), question_type(类型：choice填空/truefalse判断/choice选择题/application应用题), content(题目内容), options(如果是选择题，包含A/B/C/D选项数组), ai_answer(AI推理的答案)
2. 只返回有效的题目，忽略页眉页脚
3. 答案尽量准确

返回格式：
{
  "questions": [
    {
      "question_no": 1,
      "question_type": "fill",
      "content": "题目内容",
      "options": [],
      "ai_answer": "答案"
    }
  ]
}

请直接返回JSON，不要有其他文字。`

    const questions = []
    
    // 逐张图片识别
    for (const photo of photos) {
      try {
        const photoUrl = photo.startsWith('data:') || photo.startsWith('http') 
          ? photo 
          : photo
        
        const result = await visionAnalyze(photoUrl, prompt)
        
        // visionAnalyze 返回 JSON 对象
        if (result && result.questions && Array.isArray(result.questions)) {
          questions.push(...result.questions)
        }
      } catch (e) {
        console.error('单张图片识别失败:', e.message)
      }
    }
    
    // 去重（按题号）
    const uniqueQuestions = []
    const seenNos = new Set()
    for (const q of questions) {
      if (!seenNos.has(q.question_no)) {
        seenNos.add(q.question_no)
        uniqueQuestions.push({
          ...q,
          subject_id,
          options: q.options || []
        })
      }
    }
    
    ctx.body = success({
      questions: uniqueQuestions,
      count: uniqueQuestions.length,
      message: `识别完成，共${uniqueQuestions.length}道题目`
    })
  } catch (e) {
    console.error('OCR识别失败:', e)
    ctx.body = error(500, 'OCR识别失败: ' + e.message)
  }
}

// ========== 题目管理 ==========

// 获取题库列表
export async function getQuestions(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { subject_id, question_type, search, page = 1, limit = 20 } = ctx.query
  const offset = (parseInt(page) - 1) * parseInt(limit)
  
  try {
    let where = 'WHERE sq.subject_id IN (SELECT id FROM study_subjects WHERE family_id = $1 AND is_active = true)'
    const values = [user.family_id]
    let idx = 2
    
    if (subject_id) {
      where += ` AND sq.subject_id = $${idx++}`
      values.push(subject_id)
    }
    
    if (question_type) {
      where += ` AND sq.question_type = $${idx++}`
      values.push(question_type)
    }
    
    if (search) {
      where += ` AND sq.content ILIKE $${idx++}`
      values.push(`%${search}%`)
    }
    
    // 只返回已审核的题目
    where += ' AND sq.parent_reviewed = true'
    
    values.push(parseInt(limit), offset)
    
    const result = await pool.query(
      `SELECT sq.id, sq.subject_id, sq.question_no, sq.question_type, sq.content,
              sq.options, sq.correct_answer, sq.difficulty, sq.times_asked, sq.times_correct,
              ss.name as subject_name, ss.icon as subject_icon, ss.color as subject_color,
              sq.created_at
       FROM study_questions sq
       JOIN study_subjects ss ON sq.subject_id = ss.id
       ${where}
       ORDER BY sq.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    )
    
    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM study_questions sq ${where}`,
      values.slice(0, -2)
    )
    
    ctx.body = success({
      questions: result.rows,
      total: parseInt(countResult.rows[0].total)
    })
  } catch (err) {
    console.error('GetQuestions error:', err)
    ctx.body = error(500, '获取题库失败')
  }
}

// 获取单条题目
export async function getQuestion(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  
  try {
    const result = await pool.query(
      `SELECT sq.*, ss.name as subject_name, ss.icon as subject_icon
       FROM study_questions sq
       JOIN study_subjects ss ON sq.subject_id = ss.id
       WHERE sq.id = $1`,
      [id]
    )
    
    if (result.rows.length === 0) {
      ctx.body = error(404, '题目不存在')
      return
    }
    
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('GetQuestion error:', err)
    ctx.body = error(500, '获取题目失败')
  }
}

// 更新题目（家长校正）
export async function updateQuestion(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '只有家长可以更新题目')
    return
  }
  
  const { id } = ctx.params
  const { content, options, correct_answer, parent_reviewed, difficulty } = ctx.request.body
  
  try {
    const updates = []
    const values = []
    let idx = 1
    
    if (content !== undefined) { updates.push(`content = $${idx++}`); values.push(content) }
    if (options !== undefined) { updates.push(`options = $${idx++}`); values.push(JSON.stringify(options)) }
    if (correct_answer !== undefined) { updates.push(`correct_answer = $${idx++}`); values.push(correct_answer) }
    if (parent_reviewed !== undefined) { updates.push(`parent_reviewed = $${idx++}`); values.push(parent_reviewed) }
    if (difficulty !== undefined) { updates.push(`difficulty = $${idx++}`); values.push(difficulty) }
    updates.push(`updated_at = NOW()`)
    
    if (updates.length === 1) {
      ctx.body = error(400, '没有要更新的字段')
      return
    }
    
    values.push(id)
    const result = await pool.query(
      `UPDATE study_questions SET ${updates.join(', ')}
       WHERE id = $${idx}
       RETURNING *`,
      values
    )
    
    if (result.rows.length === 0) {
      ctx.body = error(404, '题目不存在')
      return
    }
    
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('UpdateQuestion error:', err)
    ctx.body = error(500, '更新题目失败')
  }
}

// 批量创建题目
export async function batchCreateQuestions(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  if (user.role !== 'admin') {
    ctx.body = error(ErrorCodes.FORBIDDEN, '只有家长可以创建题目')
    return
  }
  
  const { record_id, questions } = ctx.request.body
  
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    ctx.body = error(400, '请提供题目列表')
    return
  }
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    const createdQuestions = []
    for (const q of questions) {
      const result = await client.query(
        `INSERT INTO study_questions (subject_id, record_id, question_no, question_type, content, options, ai_answer, correct_answer, parent_reviewed, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [q.subject_id, record_id, q.question_no, q.question_type, q.content, JSON.stringify(q.options || []), q.ai_answer, q.correct_answer, false, 'photo']
      )
      createdQuestions.push(result.rows[0])
    }
    
    // 更新学习记录状态
    if (record_id) {
      await client.query(
        `UPDATE study_records SET status = 'approved', updated_at = NOW() WHERE id = $1`,
        [record_id]
      )
    }
    
    await client.query('COMMIT')
    ctx.body = success({ questions: createdQuestions })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('BatchCreateQuestions error:', err)
    ctx.body = error(500, '批量创建题目失败')
  } finally {
    client.release()
  }
}

// ========== 错题本 ==========

// 获取错题列表
export async function getWrongQuestions(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { subject_id, mastered, user_id, page = 1, limit = 20 } = ctx.query
  const offset = (parseInt(page) - 1) * parseInt(limit)
  
  try {
    let where = 'WHERE wq.user_id = $1'
    const values = [user.id]
    let paramCount = 1  // 记录已使用的占位符数量
    
    if (subject_id) {
      paramCount++
      where += ` AND sq.subject_id = $${paramCount}`
      values.push(subject_id)
    }
    
    if (mastered !== undefined && mastered !== "") {
      paramCount++
      where += ` AND wq.mastered = $${paramCount}`
      values.push(mastered === 'true')
    }
    
    // limit 和 offset 使用剩余的占位符
    const limitVal = parseInt(limit) || 20
    const offsetVal = parseInt(offset) || 0
    
    const result = await pool.query(
      `SELECT wq.id, wq.times_wrong, wq.times_reviewed, wq.mastered, wq.last_reviewed, wq.created_at,
              sq.id as question_id, sq.question_no, sq.question_type, sq.content, sq.options,
              sq.correct_answer, sq.times_asked, sq.times_correct,
              ss.name as subject_name, ss.icon as subject_icon, ss.color as subject_color
       FROM study_wrong_questions wq
       JOIN study_questions sq ON wq.question_id = sq.id
       JOIN study_subjects ss ON sq.subject_id = ss.id
       ${where}
       ORDER BY wq.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...values, limitVal, offsetVal]
    )
    
    ctx.body = success(result.rows)
  } catch (err) {
    console.error('GetWrongQuestions error:', err)
    ctx.body = error(500, '获取错题列表失败')
  }
}

// 添加错题
export async function addWrongQuestion(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { question_id } = ctx.request.body
  
  if (!question_id) {
    ctx.body = error(400, '请提供题目ID')
    return
  }
  
  try {
    // 如果已存在，只增加错误次数
    const existing = await pool.query(
      'SELECT id, times_wrong FROM study_wrong_questions WHERE user_id = $1 AND question_id = $2',
      [user.id, question_id]
    )
    
    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE study_wrong_questions SET times_wrong = times_wrong + 1 WHERE id = $1',
        [existing.rows[0].id]
      )
      ctx.body = success({ message: '错题次数已更新' })
      return
    }
    
    const result = await pool.query(
      `INSERT INTO study_wrong_questions (user_id, question_id)
       VALUES ($1, $2)
       RETURNING *`,
      [user.id, question_id]
    )
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('AddWrongQuestion error:', err)
    ctx.body = error(500, '添加错题失败')
  }
}

// 更新错题（标记掌握）
export async function updateWrongQuestion(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { id } = ctx.params
  const { mastered } = ctx.request.body
  
  try {
    const updates = []
    const values = []
    let idx = 1
    
    if (mastered !== undefined && mastered !== "") {
      updates.push(`mastered = $${idx++}`)
      values.push(mastered)
      if (mastered) {
        updates.push(`last_reviewed = NOW()`)
      }
    }
    
    if (updates.length === 0) {
      ctx.body = error(400, '没有要更新的字段')
      return
    }
    
    values.push(id, user.id)
    const result = await pool.query(
      `UPDATE study_wrong_questions SET ${updates.join(', ')}
       WHERE id = $${idx++} AND user_id = $${idx}
       RETURNING *`,
      values
    )
    
    if (result.rows.length === 0) {
      ctx.body = error(404, '错题不存在')
      return
    }
    
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('UpdateWrongQuestion error:', err)
    ctx.body = error(500, '更新错题失败')
  }
}

// 移除错题
export async function removeWrongQuestion(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { questionId } = ctx.params
  
  try {
    const result = await pool.query(
      'DELETE FROM study_wrong_questions WHERE question_id = $1 AND user_id = $2 RETURNING id',
      [questionId, user.id]
    )
    
    if (result.rows.length === 0) {
      ctx.body = error(404, '错题不存在')
      return
    }
    
    ctx.body = success({ message: '已移除错题' })
  } catch (err) {
    console.error('RemoveWrongQuestion error:', err)
    ctx.body = error(500, '移除错题失败')
  }
}

// ========== 练习 ==========

// 开始练习
export async function startPractice(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { subject_id, count = 10, mode = 'all' } = ctx.request.body
  
  if (!subject_id) {
    ctx.body = error(400, '请选择科目')
    return
  }
  
  try {
    let query
    let queryParams
    
    if (mode === 'wrong') {
      // 从错题本抽取
      query = `SELECT q.id, q.question_no, q.question_type, q.content, q.options
               FROM study_wrong_questions wq
               JOIN study_questions q ON wq.question_id = q.id
               WHERE wq.user_id = $1 AND q.subject_id = $2 AND wq.mastered = false
               ORDER BY RANDOM()
               LIMIT $3`
      queryParams = [user.id, subject_id, parseInt(count)]
    } else {
      // 从全部题库抽取
      query = `SELECT id, question_no, question_type, content, options
               FROM study_questions
               WHERE subject_id = $1 AND parent_reviewed = true
               ORDER BY RANDOM()
               LIMIT $2`
      queryParams = [subject_id, parseInt(count)]
    }
    
    const result = await pool.query(query, queryParams)
    
    if (result.rows.length === 0) {
      ctx.body = success({ questions: [], message: '暂无题目' })
      return
    }
    
    ctx.body = success({
      questions: result.rows,
      mode
    })
  } catch (err) {
    console.error('StartPractice error:', err)
    ctx.body = error(500, '获取练习题目失败')
  }
}

// 提交练习
export async function submitPractice(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  const { subject_id, questions, answers, mode = 'all' } = ctx.request.body
  
  if (!subject_id || !questions || !answers) {
    ctx.body = error(400, '参数不完整')
    return
  }
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // 比对答案
    const questionIds = questions.map(q => q.id)
    const results = {}
    let correctCount = 0
    const wrongQuestionIds = []
    
    // 获取题目正确答案
    const questionResults = await client.query(
      `SELECT id, correct_answer FROM study_questions WHERE id = ANY($1::uuid[])`,
      [questionIds]
    )
    
    const questionMap = {}
    for (const q of questionResults.rows) {
      questionMap[q.id] = q.correct_answer
    }
    
    // 比对并记录结果
    for (const q of questions) {
      const correctAnswer = questionMap[q.id]
      const userAnswer = answers[q.id]
      const isCorrect = correctAnswer && userAnswer && correctAnswer.toString().trim() === userAnswer.toString().trim()
      results[q.id] = isCorrect
      
      if (isCorrect) {
        correctCount++
        // 答对了，更新题目正确次数
        await client.query(
          'UPDATE study_questions SET times_correct = times_correct + 1, times_asked = times_asked + 1 WHERE id = $1',
          [q.id]
        )
        // 如果在错题本中，移除
        await client.query(
          'DELETE FROM study_wrong_questions WHERE user_id = $1 AND question_id = $2',
          [user.id, q.id]
        )
      } else {
        wrongQuestionIds.push(q.id)
        // 答错了，加入错题本
        await client.query(
          `INSERT INTO study_wrong_questions (user_id, question_id, times_wrong)
           VALUES ($1, $2, 1)
           ON CONFLICT (user_id, question_id) DO UPDATE
           SET times_wrong = study_wrong_questions.times_wrong + 1, mastered = false`,
          [user.id, q.id]
        )
        // 更新题目被抽次数
        await client.query(
          'UPDATE study_questions SET times_asked = times_asked + 1 WHERE id = $1',
          [q.id]
        )
      }
    }
    
    const score = Math.round((correctCount / questions.length) * 100)
    
    // 记录练习日志
    await client.query(
      `INSERT INTO study_practice_logs (user_id, subject_id, mode, question_ids, answers, results, score)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, subject_id, mode, JSON.stringify(questionIds), JSON.stringify(answers), JSON.stringify(results), score]
    )
    
    await client.query('COMMIT')
    
    ctx.body = success({
      score,
      total: questions.length,
      correct: correctCount,
      results,
      new_wrong_count: wrongQuestionIds.length
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('SubmitPractice error:', err)
    ctx.body = error(500, '提交练习失败')
  } finally {
    client.release()
  }
}

// 今日练习统计
export async function getTodayStats(ctx) {
  const user = await getUserFromToken(ctx)
  if (!user) return
  
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const result = await pool.query(
      `SELECT COUNT(*) as practice_count,
              COALESCE(AVG(score), 0) as avg_score,
              COALESCE(SUM(CASE WHEN score >= 60 THEN 1 ELSE 0 END), 0) as pass_count
       FROM study_practice_logs
       WHERE user_id = $1 AND DATE(practiced_at) = $2`,
      [user.id, today]
    )
    
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('GetTodayStats error:', err)
    ctx.body = error(500, '获取统计失败')
  }
}
