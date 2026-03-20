import request from './index'

// 获取日志
export function getLogs(params) {
  return request.get('/logs', { params })
}
