import request from './request'

export function getPendingApprovals() {
  return request({ url: '/approvals/pending', method: 'GET' })
}

export function getApprovalHistory() {
  return request({ url: '/approvals/history', method: 'GET' })
}

export function approveTask(id, data) {
  return request({ url: '/approvals/task/' + id, method: 'PUT', data })
}

export function approveExchange(id, data) {
  return request({ url: '/approvals/exchange/' + id, method: 'PUT', data })
}

export function reverseApproval(id, type) {
  return request({ url: '/approvals/reverse/' + id, method: 'PUT', data: { type } })
}
