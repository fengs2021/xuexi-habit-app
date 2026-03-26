import request from './request'

export function getAvatars() {
  return request({ url: '/avatars', method: 'GET' })
}

export function updateAvatar(userId, avatarId) {
  return request({ 
    url: '/display/settings', 
    method: 'PUT',
    data: { userId, avatarId }
  })
}
