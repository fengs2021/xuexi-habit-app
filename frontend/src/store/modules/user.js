import { defineStore } from 'pinia'
import { loginParent, registerChild, getUserInfo } from '@/api/auth'
import { setToken, removeToken } from '@/utils/auth'
import { ROLES } from '@/utils/permission'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: null,
    roles: [],
    targetReward: null
  }),
  getters: {
    isAdmin: state => state.roles.includes(ROLES.ADMIN),
    isChild: state => state.roles.includes(ROLES.CHILD),
    isLogin: state => !!state.token,
    stars: state => state.userInfo?.stars || 0
  },
  actions: {
    async loginParentAction(data) {
      const res = await loginParent(data)
      this.token = res.token
      this.userInfo = res.user
      this.roles = [res.user.role]
      setToken(res.token)
      return res
    },
    async loginChildAction(data) {
      // 孩子使用registerChild API (邀请码注册)
      const res = await registerChild(data)
      this.token = res.token
      this.userInfo = res.user
      this.roles = [res.user.role]
      setToken(res.token)
      if (res.user && res.user.deviceId) {
        localStorage.setItem('deviceId', res.user.deviceId)
      }
      return res
    },
    async getUserInfoAction() {
      const res = await getUserInfo()
      this.userInfo = res
      this.roles = [res.role]
      return res
    },
    setTargetReward(reward) {
      this.targetReward = reward
    },
    clearTargetReward() {
      this.targetReward = null
    },
    logoutAction() {
      this.token = ''
      this.userInfo = null
      this.roles = []
      this.targetReward = null
      removeToken()
    }
  },
  persist: {
    key: 'USER_STORE',
    storage: localStorage,
    paths: ['token', 'userInfo', 'roles', 'targetReward']
  }
})
