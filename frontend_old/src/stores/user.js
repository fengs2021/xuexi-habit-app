import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '../api/auth'
import * as userApi from '../api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  const familyInfo = ref(null)

  const isLoggedIn = computed(() => !!token.value)
  const isParent = computed(() => ['admin', 'parent'].includes(userInfo.value?.role))
  const isChild = computed(() => userInfo.value?.role === 'child')

  // 家长登录
  async function loginParent(data) {
    try {
      const res = await authApi.loginParent(data)
      token.value = res.data.token
      localStorage.setItem('token', res.data.token)
      userInfo.value = res.data.user
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 设备登录(孩子)
  async function loginDevice(data) {
    try {
      const res = await authApi.loginDevice(data)
      token.value = res.data.token
      localStorage.setItem('token', res.data.token)
      userInfo.value = res.data.user
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 家长注册
  async function registerParent(data) {
    try {
      const res = await authApi.registerParent(data)
      token.value = res.data.token
      localStorage.setItem('token', res.data.token)
      userInfo.value = res.data.user
      return res.data
    } catch (error) {
      throw error
    }
  }

  // 孩子注册
  async function registerChild(data) {
    try {
      const res = await authApi.registerChild(data)
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

  // 获取孩子列表(家长)
  async function fetchChildren() {
    try {
      const res = await userApi.getChildren()
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
    isParent,
    isChild,
    loginParent,
    loginDevice,
    registerParent,
    registerChild,
    fetchCurrentUser,
    fetchFamily,
    fetchChildren,
    logout
  }
})
