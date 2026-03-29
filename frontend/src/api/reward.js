import request from './request'

export function getRewards(params) {
  return request({ url: '/rewards', method: 'GET', params })
}

export function createReward(data) {
  return request({ url: '/rewards', method: 'POST', data })
}

export function updateReward(data) {
  return request({ url: '/rewards/' + data.id, method: 'PUT', data })
}

export function createExchange(data) {
  return request({ url: '/exchanges', method: 'POST', data })
}

export function getStudentExchanges() {
  return request({ url: '/exchanges/student-history', method: 'GET' })
}

// 贴纸抽奖API
export function getWeeklyLimitedStickers() {
  return request({ url: '/sticker-lottery/weekly-limited', method: 'GET' })
}

export function getLotteryProgress(userId) {
  return request({ url: `/sticker-lottery/progress/${userId}`, method: 'GET' })
}

export function drawSticker(userId) {
  return request({ url: `/sticker-lottery/draw/${userId}`, method: 'POST' })
}

export function guaranteeExchange(userId, stickerId) {
  return request({ url: `/sticker-lottery/guarantee-exchange/${userId}`, method: 'POST', data: { stickerId } })
}

export function getExchangeOptions(userId) {
  return request({ url: `/sticker-lottery/exchange-options/${userId}`, method: 'GET' })
}
