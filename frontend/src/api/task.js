import request from './request'

export function getTasks(params) {
  return request({ url: '/tasks', method: 'GET', params })
}

export function createTask(data) {
  return request({ url: '/tasks', method: 'POST', data })
}

export function updateTask(data) {
  return request({ url: '/tasks/' + data.id, method: 'PUT', data })
}

export function deleteTask(id) {
  return request({ url: '/tasks/' + id, method: 'DELETE' })
}

export function completeTask(id) {
  return request({ url: '/tasks/' + id + '/complete', method: 'POST' })
}

export function skipTask(id) {
  return request({ url: '/tasks/' + id + '/skip', method: 'POST' })
}

export function getStudentTaskStatus() {
  return request({ url: '/tasks/student-status', method: 'GET' })
}

export function getCycleTaskStatus() {
  return request({ url: '/tasks/cycle-status', method: 'GET' })
}

export function deductStars(data) {
  return request({ url: '/tasks/deduct', method: 'POST', data })
}
