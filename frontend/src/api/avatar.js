import request from './request'

export function getAvatars() {
  return request({ url: '/avatars', method: 'GET' })
}

export function updateAvatar(avatarId) {
  return request({ 
    url: '/api/display/avatar', 
    method: 'PUT',
    data: { avatar_id: avatarId }
  })
}
