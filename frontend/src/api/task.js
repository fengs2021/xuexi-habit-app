import request from './request'

export function getTaskList(params) {
  return request({ url: '/tasks', method: 'GET', params })
}

export function createTask(data) {
  return request({ url: '/tasks', method: 'POST', data })
}

export function completeTask(id) {
  return request({ url: '/tasks/' + id + '/complete', method: 'POST' })
}

export function skipTask(id) {
  return request({ url: '/tasks/' + id + '/skip', method: 'POST' })
}

export function deleteTask(id) {
  return request({ url: '/tasks/' + id, method: 'DELETE' })
}
