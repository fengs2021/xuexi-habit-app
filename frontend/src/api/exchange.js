import request from './index'

// 获取兑换记录
export function getExchanges(params) {
  return request.get('/exchanges', { params })
}

// 发起兑换
export function createExchange(data) {
  return request.post('/exchanges', data)
}

// 更新兑换状态
export function updateExchange(id, data) {
  return request.put(`/exchanges/${id}`, data)
}
