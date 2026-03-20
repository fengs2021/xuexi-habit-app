import request from './request'

export function getFamily() {
  return request({ url: '/family', method: 'GET' })
}

export function generateInviteCode() {
  return request({ url: '/family/invite', method: 'POST' })
}
