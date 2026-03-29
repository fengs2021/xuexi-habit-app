import request from './request'

export function get(userId) {
  return request({ url: '/emoji-pets/' + userId, method: 'GET' })
}

export function getAll(userId) {
  return request({ url: '/emoji-pets/' + userId + '/all', method: 'GET' })
}

export function unlock(userId, emojiPetId) {
  return request({ url: '/emoji-pets/unlock/' + userId + '/' + emojiPetId, method: 'POST' })
}
