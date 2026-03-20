import request from './index'

// 获取家庭信息
export function getFamily() {
  return request.get('/family')
}

// 更新家庭信息
export function updateFamily(data) {
  return request.put('/family', data)
}

// 加入家庭
export function joinFamily(data) {
  return request.post('/family/join', data)
}

// 获取家庭成员
export function getFamilyMembers() {
  return request.get('/family/members')
}

// 获取用户信息
export function getUser(id) {
  return request.get(`/users/${id}`)
}

// 更新用户信息
export function updateUser(id, data) {
  return request.put(`/users/${id}`, data)
}

// 获取用户统计
export function getUserStats(id) {
  return request.get(`/users/${id}/stats`)
}

// 获取排行榜
export function getLeaderboard(type = 'wish') {
  return request.get('/leaderboard', { params: { type } })
}
