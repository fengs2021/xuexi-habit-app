import api from './index'
export function getFamily() { return api.get('/family') }
export function updateFamily(data) { return api.put('/family', data) }
export function getChildren() { return api.get('/family/children') }
export function generateInviteCode() { return api.post('/family/invite') }
