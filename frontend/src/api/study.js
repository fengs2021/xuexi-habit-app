import request from './request'

// ========== 科目 ==========
export function getSubjects() {
  return request({ url: '/study/subjects', method: 'GET' })
}

export function createSubject(data) {
  return request({ url: '/study/subjects', method: 'POST', data })
}

export function updateSubject(id, data) {
  return request({ url: '/study/subjects/' + id, method: 'PUT', data })
}

export function deleteSubject(id) {
  return request({ url: '/study/subjects/' + id, method: 'DELETE' })
}

// ========== 学习记录 ==========
export function getRecords(params) {
  return request({ url: '/study/records', method: 'GET', params })
}

export function getRecord(id) {
  return request({ url: '/study/records/' + id, method: 'GET' })
}

export function createRecord(data) {
  return request({ url: '/study/records', method: 'POST', data })
}

export function updateRecord(id, data) {
  return request({ url: '/study/records/' + id, method: 'PUT', data })
}

export function deleteRecord(id) {
  return request({ url: '/study/records/' + id, method: 'DELETE' })
}

// ========== OCR ==========
export function ocrIdentify(data) {
  return request({ url: '/study/ocr', method: 'POST', data })
}

// ========== 题目 ==========
export function getQuestions(params) {
  return request({ url: '/study/questions', method: 'GET', params })
}

export function getQuestion(id) {
  return request({ url: '/study/questions/' + id, method: 'GET' })
}

export function updateQuestion(id, data) {
  return request({ url: '/study/questions/' + id, method: 'PUT', data })
}

export function batchCreateQuestions(data) {
  return request({ url: '/study/questions/batch', method: 'POST', data })
}

// ========== 错题本 ==========
export function getWrongQuestions(params) {
  return request({ url: '/study/wrong-questions', method: 'GET', params })
}

export function addWrongQuestion(data) {
  return request({ url: '/study/wrong-questions', method: 'POST', data })
}

export function updateWrongQuestion(id, data) {
  return request({ url: '/study/wrong-questions/' + id, method: 'PUT', data })
}

export function removeWrongQuestion(questionId) {
  return request({ url: '/study/wrong-questions/' + questionId, method: 'DELETE' })
}

// ========== 练习 ==========
export function startPractice(data) {
  return request({ url: '/study/practice/start', method: 'POST', data })
}

export function submitPractice(data) {
  return request({ url: '/study/practice/submit', method: 'POST', data })
}

export function getTodayStats() {
  return request({ url: '/study/practice/today', method: 'GET' })
}
