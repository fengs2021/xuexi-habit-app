import request from './request'

export function getWeeklyReport(childId, type) {
  let url = '/report/weekly/' + childId
  if (type) url += '?type=' + type
  return request({ url, method: 'GET' })
}

export function markReportViewed(childId) {
  return request({ url: '/report/weekly/' + childId + '/viewed', method: 'PUT' })
}
