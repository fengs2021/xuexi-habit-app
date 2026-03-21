import request from './request'

export function getSigninInfo(userId) {
  return request({ url: '/signin/info/' + userId, method: 'GET' })
}

export function checkin(userId) {
  return request({ url: '/signin/checkin', method: 'POST', data: { userId } })
}
