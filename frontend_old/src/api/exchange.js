import request from './index'

// 发起兑换(孩子)
export function createExchange(data) {
  return request.post('/exchanges', data)
}

// 获取待审批列表(家长)
export function getPendingExchanges() {
  return request.get('/exchanges/pending')
}

// 批准兑换(家长)
export function approveExchange(id, data) {
  return request.put('/exchanges/' + id + '/approve', data)
}

// 拒绝兑换(家长)
export function rejectExchange(id, data) {
  return request.put('/exchanges/' + id + '/reject', data)
}

// 获取兑换历史
export function getExchangeHistory() {
  return request.get('/exchanges/history')
}
