import request from './request'

export function getPetInfo(userId) {
  return request({ url: '/pet/info/' + userId, method: 'GET' })
}

export function getAllPets(userId) {
  return request({ url: '/pet/all/' + userId, method: 'GET' })
}

export function carePet(userId, action) {
  return request({ url: '/pet/care', method: 'POST', data: { userId, action } })
}

export function changePet(userId, petType) {
  return request({ url: '/pet/change', method: 'PUT', data: { userId, petType } })
}
