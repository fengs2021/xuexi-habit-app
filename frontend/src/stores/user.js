import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '../api/auth'
import * as userApi from '../api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  const familyInfo = ref(null)

  const isLoggedIn = computed(() => !!token.value)
  const currentChild = computed(() => {
    if (!familyInfo.value?.members) return null
    return familyInfo.value.members.find(m => m.isCurrent) || familyInfo.value.members[0]
  })

  // 登录
  async function login(deviceId) {
    try {
      const res = await authApi.login({ deviceId })
      token.value = res.data.token
      localStorage.setItem('token', res.data.token)
      userInfo.value = res.data.user
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 注册
  async function register(data) {
    try {
      const res = await authApi.register(data)
      token.value = res.data.token
      localStorage.setItem('token', res.data.token)
      userInfo.value = res.data.user
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 获取当前用户
  async function fetchCurrentUser() {
    try {
      const res = await authApi.getCurrentUser()
      userInfo.value = res.data
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 获取家庭信息
  async function fetchFamily() {
    try {
      const res = await userApi.getFamily()
      familyInfo.value = res.data
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 更新用户信息
  async function updateUser(id, data) {
    try {
      const res = await userApi.updateUser(id, data)
      if (userInfo.value?.id === id) {
        userInfo.value = { ...userInfo.value, ...res.data }
      }
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 登出
  function logout() {
    token.value = ''
    userInfo.value = null
    familyInfo.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    userInfo,
    familyInfo,
    isLoggedIn,
    currentChild,
    login,
    register,
    fetchCurrentUser,
    fetchFamily,
    updateUser,
    logout
  }
})
