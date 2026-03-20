import request from './request'

export function getRewards(params) {
  return request({ url: '/rewards', method: 'GET', params })
}

export function createReward(data) {
  return request({ url: '/rewards', method: 'POST', data })
}

export function createExchange(data) {
  return request({ url: '/exchanges', method: 'POST', data })
}
