import request from './index'

// 家长注册
export function registerParent(data) {
  return request.post('/auth/register/parent', data)
}

// 孩子注册(邀请码)
export function registerChild(data) {
  return request.post('/auth/register/child', data)
}

// 家长登录
export function loginParent(data) {
  return request.post('/auth/login/parent', data)
}

// 设备登录(孩子)
export function loginDevice(data) {
  return request.post('/auth/login/device', data)
}

// 刷新Token
export function refreshToken(data) {
  return request.post('/auth/refresh', data)
}

// 获取当前用户
export function getCurrentUser() {
  return request.get('/auth/me')
}

// 登出
export function logout() {
  return request.post('/auth/logout')
}
