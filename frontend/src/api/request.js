import axios from 'axios'
import { showToast } from 'vant'
import { getToken, getRefreshToken, setToken, removeToken } from '@/utils/auth'
import router from '@/router'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

// Token 刷新状态标志，防止并发刷新
let isRefreshing = false
let refreshQueue = []

// 处理刷新失败的队列
const processQueue = (error) => {
  refreshQueue.forEach(promise => {
    if (error) promise.reject(error)
    else promise.resolve()
  })
  refreshQueue = []
}

// 刷新 Token
async function refreshToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  
  try {
    const res = await axios.post(
      import.meta.env.VITE_API_BASE_URL + '/auth/refresh',
      { refreshToken },
      { skipAuth: true }
    )
    if (res.data?.token) {
      setToken(res.data.token)
      if (res.data.refreshToken) {
        localStorage.setItem('REFRESH_TOKEN', res.data.refreshToken)
      }
      return res.data.token
    }
  } catch (e) {
    console.error('Token refresh failed:', e)
  }
  return null
}

service.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }
    return config
  },
  error => Promise.reject(error)
)

service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== undefined && res.code !== 200 && res.code !== 0) {
      showToast(res.message || '请求失败')
      if (res.code === 1002 || res.code === 401) {
        removeToken()
        router.push('/login')
      }
      return Promise.reject(new Error(res.message))
    }
    return res.data
  },
  async error => {
    const originalRequest = error.config
    
    // 如果是 401 且不是刷新请求，且没有重试过
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.skipAuth) {
      if (isRefreshing) {
        // 如果正在刷新，把请求加入队列
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token
          return service(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }
      
      originalRequest._retry = true
      isRefreshing = true
      
      try {
        const newToken = await refreshToken()
        if (newToken) {
          processQueue(null)
          originalRequest.headers.Authorization = 'Bearer ' + newToken
          return service(originalRequest)
        } else {
          processQueue(new Error('Token refresh failed'))
          removeToken()
          router.push('/login')
        }
      } catch (e) {
        processQueue(e)
        removeToken()
        router.push('/login')
      } finally {
        isRefreshing = false
      }
    }
    
    showToast(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default service
