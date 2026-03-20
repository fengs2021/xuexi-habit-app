import axios from 'axios'

function transformData(obj) {
  if (Array.isArray(obj)) return obj.map(transformData)
  if (obj && typeof obj === 'object') {
    const result = {}
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, m => m[1].toUpperCase())
      result[camelKey] = transformData(obj[key])
    }
    return result
  }
  return obj
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

api.interceptors.response.use(
  res => {
    const data = res.data
    if (data.code !== 0) return Promise.reject(new Error(data.message || '请求失败'))
    data.data = transformData(data.data)
    return data
  },
  err => Promise.reject(err)
)

export default api
