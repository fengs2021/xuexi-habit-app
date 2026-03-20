import request from './index'

// 获取奖励列表
export function getRewards() {
  return request.get('/rewards')
}

// 创建奖励
export function createReward(data) {
  return request.post('/rewards', data)
}

// 更新奖励
export function updateReward(id, data) {
  return request.put(`/rewards/${id}`, data)
}

// 删除奖励
export function deleteReward(id) {
  return request.delete(`/rewards/${id}`)
}
