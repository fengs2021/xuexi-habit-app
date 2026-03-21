import request from './request'

export function getStickers() {
  return request({ url: '/stickers', method: 'GET' })
}

export function getUserStickers(userId) {
  return request({ url: '/stickers/user/' + userId, method: 'GET' })
}

export function getUserStickerIds(userId) {
  return request({ url: '/stickers/user/' + userId + '/ids', method: 'GET' })
}
