import request from './index'

// 获取家庭信息
export function getFamily() {
  return request.get('/family')
}

// 更新家庭信息
export function updateFamily(data) {
  return request.put('/family', data)
}

// 生成邀请码
export function generateInviteCode() {
  return request.post('/family/invite')
}

// 获取孩子列表
export function getChildren() {
  return request.get('/family/children')
}

// 移除家庭成员
export function removeMember(userId) {
  return request.delete('/family/member/' + userId)
}

// 获取排行榜(预留接口)
export function getLeaderboard(type) {
  return request.get('/leaderboard', { params: { type } })
}
