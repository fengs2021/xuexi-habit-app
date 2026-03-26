import request from './request'

export function getFamily() {
  return request({ url: '/family', method: 'GET' })
}

export function generateInviteCode() {
  return request({ url: '/family/invite', method: 'POST' })
}

export function getChildrenTaskProgress() {
  return request({ url: '/family/children-task-progress', method: 'GET' })
}

export function getFamilyChildren() {
  return request({ url: '/family/children', method: 'GET' })
}
