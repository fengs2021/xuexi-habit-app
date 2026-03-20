import request from './request'

export function getRewardList(params) {
  return request({ url: '/rewards', method: 'GET', params })
}

export function createReward(data) {
  return request({ url: '/rewards', method: 'POST', data })
}

export function deleteReward(id) {
  return request({ url: '/rewards/' + id, method: 'DELETE' })
}

export function createExchange(data) {
  return request({ url: '/exchanges', method: 'POST', data })
}

export function getPendingExchanges() {
  return request({ url: '/exchanges/pending', method: 'GET' })
}

export function approveExchange(id, data) {
  return request({ url: '/exchanges/' + id + '/approve', method: 'PUT', data })
}

export function getExchangeList() {
  return request({ url: '/exchanges', method: 'GET' })
}
