import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '../api/auth'
import * as familyApi from '../api/family'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  const familyInfo = ref(null)

  const isLoggedIn = computed(() => !!token.value)
  const isParent = computed(() => ['admin', 'parent'].includes(userInfo.value?.role))
  const isChild = computed(() => userInfo.value?.role === 'child')
  const currentChild = computed(() => {
    if (!familyInfo.value?.members) return userInfo.value
    return familyInfo.value.members.find(m => m.isCurrent) || familyInfo.value.members[0] || userInfo.value
  })

  async function loginParent(data) {
    const res = await authApi.loginParent(data)
    token.value = res.data.token
    localStorage.setItem('token', res.data.token)
    userInfo.value = res.data.user
    return res
  }

  async function loginDevice(data) {
    const res = await authApi.loginDevice(data)
    token.value = res.data.token
    localStorage.setItem('token', res.data.token)
    userInfo.value = res.data.user
    return res
  }

  async function registerParent(data) {
    const res = await authApi.registerParent(data)
    token.value = res.data.token
    localStorage.setItem('token', res.data.token)
    userInfo.value = res.data.user
    return res
  }

  async function registerChild(data) {
    const res = await authApi.registerChild(data)
    token.value = res.data.token
    localStorage.setItem('token', res.data.token)
    userInfo.value = res.data.user
    return res
  }

  async function fetchUserInfo() {
    try {
      const res = await authApi.getCurrentUser()
      userInfo.value = res.data
      return res.data
    } catch (e) { return null }
  }

  async function fetchFamily() {
    try {
      const res = await familyApi.getFamily()
      familyInfo.value = res.data
      return res.data
    } catch (e) { return null }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    familyInfo.value = null
    localStorage.removeItem('token')
  }

  return { token, userInfo, familyInfo, isLoggedIn, isParent, isChild, currentChild, loginParent, loginDevice, registerParent, registerChild, fetchUserInfo, fetchFamily, logout }
})
