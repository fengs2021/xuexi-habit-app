import request from './index'

// 获取成就
export function getAchievements() {
  return request.get('/achievements')
}

// 获取成就统计
export function getAchievementStats() {
  return request.get('/achievements/stats')
}
