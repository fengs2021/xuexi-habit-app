import Router from 'koa-router'
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  getQuestions,
  getQuestion,
  updateQuestion,
  batchCreateQuestions,
  getWrongQuestions,
  addWrongQuestion,
  updateWrongQuestion,
  removeWrongQuestion,
  startPractice,
  submitPractice,
  getTodayStats,
  ocrIdentify
} from '../controllers/study.js'

const router = new Router({ prefix: '/api/study' })

// ========== 科目管理 ==========
router.get('/subjects', getSubjects)
router.post('/subjects', createSubject)
router.put('/subjects/:id', updateSubject)
router.delete('/subjects/:id', deleteSubject)

// ========== 学习记录 ==========
router.get('/records', getRecords)
router.get('/records/:id', getRecord)
router.post('/records', createRecord)
router.put('/records/:id', updateRecord)
router.delete('/records/:id', deleteRecord)

// ========== OCR 识别 ==========
router.post('/ocr', ocrIdentify)

// ========== 题目管理 ==========
router.get('/questions', getQuestions)
router.get('/questions/:id', getQuestion)
router.put('/questions/:id', updateQuestion)
router.post('/questions/batch', batchCreateQuestions)

// ========== 错题本 ==========
router.get('/wrong-questions', getWrongQuestions)
router.post('/wrong-questions', addWrongQuestion)
router.put('/wrong-questions/:id', updateWrongQuestion)
router.delete('/wrong-questions/:questionId', removeWrongQuestion)

// ========== 练习 ==========
router.post('/practice/start', startPractice)
router.post('/practice/submit', submitPractice)
router.get('/practice/today', getTodayStats)

export default router
