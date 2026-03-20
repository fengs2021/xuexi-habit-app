import request from './index'

// 获取任务列表
export function getTasks(params) {
  return request.get('/tasks', { params })
}

// 创建任务
export function createTask(data) {
  return request.post('/tasks', data)
}

// 更新任务
export function updateTask(id, data) {
  return request.put(`/tasks/${id}`, data)
}

// 删除任务
export function deleteTask(id) {
  return request.delete(`/tasks/${id}`)
}

// 完成任务
export function completeTask(id) {
  return request.post(`/tasks/${id}/complete`)
}

// 跳过任务
export function skipTask(id) {
  return request.post(`/tasks/${id}/skip`)
}
