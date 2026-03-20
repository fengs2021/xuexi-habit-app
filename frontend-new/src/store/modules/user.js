import { defineStore } from 'pinia'
import { loginParent, loginChildDevice, getUserInfo } from '@/api/auth'
import { setToken, removeToken } from '@/utils/auth'
import { ROLES } from '@/utils/permission'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: null,
    roles: []
  }),
  getters: {
    isAdmin: (state) => state.roles.includes(ROLES.ADMIN),
    isChild: (state) => state.roles.includes(ROLES.CHILD),
    isLogin: (state) => !!state.token
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
      const res = await loginChildDevice(data)
      this.token = res.token
      this.userInfo = res.user
      this.roles = [res.user.role]
      setToken(res.token)
      return res
    },
    async getUserInfoAction() {
      const res = await getUserInfo()
      this.userInfo = res
      this.roles = [res.role]
      return res
    },
    logoutAction() {
      this.token = ''
      this.userInfo = null
      this.roles = []
      removeToken()
    }
  },
  persist: {
    key: 'USER_STORE',
    storage: localStorage
  }
})
