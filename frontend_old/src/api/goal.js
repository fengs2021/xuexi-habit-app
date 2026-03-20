import request from './index'

// 获取目标列表
export function getGoals(params) {
  return request.get('/goals', { params })
}

// 创建目标
export function createGoal(data) {
  return request.post('/goals', data)
}

// 更新目标
export function updateGoal(id, data) {
  return request.put(`/goals/${id}`, data)
}

// 删除目标
export function deleteGoal(id) {
  return request.delete(`/goals/${id}`)
}
