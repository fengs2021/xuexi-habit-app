import request from './request'

export function getDailyStars(childId) {
  return request({ url: '/statistics/daily-stars/' + childId, method: 'GET' })
}

export function getDailyTasks(childId, offset = 0, limit = 7) {
  return request({ url: '/statistics/daily-tasks/' + childId, method: 'GET', params: { offset, limit } })
}

export function getNewRewards(childId) {
  return request({ url: '/statistics/new-rewards/' + childId, method: 'GET' })
}
