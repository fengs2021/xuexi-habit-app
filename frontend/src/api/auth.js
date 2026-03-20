import request from './request'

export function registerParent(data) {
  return request({ url: '/auth/register/parent', method: 'POST', data })
}

export function loginParent(data) {
  return request({ url: '/auth/login/parent', method: 'POST', data })
}

export function loginChild(data) {
  return request({ url: '/auth/login/device', method: 'POST', data })
}

export function getUserInfo() {
  return request({ url: '/auth/me', method: 'GET' })
}
