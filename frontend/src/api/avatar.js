import request from './request'

export function getAvatars(userId) {
  return request({ url: '/avatars', method: 'GET', params: { userId } })
}

export function updateAvatar(userId, avatarId) {
  return request({
    url: '/display/settings',
    method: 'PUT',
    data: { userId, avatarId }
  })
}

export function getAvatarWeeklyLimited(userId) {
  return request({ url: '/avatars/weekly-limited', method: 'GET', params: { userId } })
}

export function drawAvatar(userId) {
  return request({ url: `/avatars/gacha/${userId}`, method: 'POST' })
}

export function getAvatarProgress(userId) {
  return request({ url: `/avatars/progress/${userId}`, method: 'GET' })
}

export function getOwnedAvatars(userId) {
  return request({ url: `/avatars/owned/${userId}`, method: 'GET' })
}

export function getAvatarExchangeOptions(userId) {
  return request({ url: `/avatars/exchange-options/${userId}`, method: 'GET' })
}

export function guaranteeExchangeAvatar(userId, avatarId) {
  return request({ url: `/avatars/guarantee-exchange/${userId}`, method: 'POST', data: { avatarId } })
}
