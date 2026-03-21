import request from './request'

export function getAchievements() {
  return request({ url: '/achievements', method: 'GET' })
}

export function getUserAchievements(userId) {
  return request({ url: '/achievements/user/' + userId, method: 'GET' })
}
