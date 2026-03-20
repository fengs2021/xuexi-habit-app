import api from './index'

export function loginParent(data) { return api.post('/auth/login/parent', data) }
export function loginDevice(data) { return api.post('/auth/login/device', data) }
export function registerParent(data) { return api.post('/auth/register/parent', data) }
export function registerChild(data) { return api.post('/auth/register/child', data) }
export function getCurrentUser() { return api.get('/auth/me') }
export function logout() { return api.post('/auth/logout') }
