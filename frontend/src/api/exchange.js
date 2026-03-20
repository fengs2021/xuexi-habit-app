import request from './request'

export function getPendingExchanges() {
  return request({ url: '/exchanges/pending', method: 'GET' })
}

export function approveExchange(id, data) {
  return request({ url: '/exchanges/' + id + '/approve', method: 'PUT', data })
}
