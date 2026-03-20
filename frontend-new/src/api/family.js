import request from './request'

export function getFamily() {
  return request({ url: '/family', method: 'GET' })
}

export function updateFamily(data) {
  return request({ url: '/family', method: 'PUT', data })
}

export function getChildren() {
  return request({ url: '/family/children', method: 'GET' })
}

export function generateInviteCode() {
  return request({ url: '/family/invite', method: 'POST' })
}
