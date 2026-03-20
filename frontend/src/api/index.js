import axios from 'axios'

const api = axios.create({
  // 开发环境使用相对路径（通过 Vite 代理）
  // 生产环境使用环境变量
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 自动添加 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一处理错误
api.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 0) {
      console.error('API Error:', res.message)
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    console.error('Network Error:', error.message)
    return Promise.reject(error)
  }
)

export default api
