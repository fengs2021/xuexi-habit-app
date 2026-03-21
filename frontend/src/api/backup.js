import request from './request'

export function exportUserData(userId) {
  return request({ url: '/backup/export/' + userId, method: 'GET' })
}

export function backupFamilyData(familyId) {
  return request({ url: '/backup/family/' + familyId, method: 'GET' })
}

export function getBackupHistory(familyId) {
  return request({ url: '/backup/history/' + familyId, method: 'GET' })
}
