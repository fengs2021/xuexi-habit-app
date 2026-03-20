import api from './index'
export function getRewards() { return api.get('/rewards') }
export function createReward(data) { return api.post('/rewards', data) }
export function createExchange(data) { return api.post('/exchanges', data) }
export function getPendingExchanges() { return api.get('/exchanges/pending') }
export function approveExchange(id, data) { return api.put('/exchanges/' + id + '/approve', data) }
