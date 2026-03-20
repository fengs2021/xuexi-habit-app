import api from './index'
export function getTasks() { return api.get('/tasks') }
export function createTask(data) { return api.post('/tasks', data) }
export function completeTask(id) { return api.post('/tasks/' + id + '/complete') }
export function skipTask(id) { return api.post('/tasks/' + id + '/skip') }
export function deleteTask(id) { return api.delete('/tasks/' + id) }
