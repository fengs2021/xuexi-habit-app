import request from './request'

// 获取孩子的积分明细
export function getChildPointLogs(childId, offset = 0, limit = 50) {
  return request.get(`/points/child-logs/${childId}`, {
    params: { offset, limit }
  })
}

// 获取孩子的积分汇总
export function getChildPointSummary(childId) {
  return request.get(`/points/child-summary/${childId}`)
}
