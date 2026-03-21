import request from './request'

export function getWeeklyReport(childId) {
  return request({ url: '/report/weekly/' + childId, method: 'GET' })
}

export function markReportViewed(childId) {
  return request({ url: '/report/weekly/' + childId + '/viewed', method: 'PUT' })
}
