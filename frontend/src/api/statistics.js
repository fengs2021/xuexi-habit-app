import request from './request'

export function getDailyStars(childId) {
  return request({ url: '/statistics/daily-stars/' + childId, method: 'GET' })
}
