import request from './index'

// 设备登录
export function login(data) {
  return request.post('/auth/login', data)
}

// 注册
export function register(data) {
  return request.post('/auth/register', data)
}

// 获取当前用户
export function getCurrentUser() {
  return request.get('/auth/me')
}
