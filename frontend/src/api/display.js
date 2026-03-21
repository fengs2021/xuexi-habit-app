import request from './request'

export function getDisplaySettings(userId) {
  return request({ url: '/display/settings/' + userId, method: 'GET' })
}

export function updateDisplaySettings(data) {
  return request({ url: '/display/settings', method: 'PUT', data })
}
