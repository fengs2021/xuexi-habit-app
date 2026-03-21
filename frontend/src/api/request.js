import axios from 'axios'
import { showToast } from 'vant'
import { getToken, removeToken } from '@/utils/auth'
import router from '@/router'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

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
  error => {
    showToast(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default service
