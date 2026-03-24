import { defineStore } from 'pinia'
import { loginParent, registerChild, getUserInfo } from '@/api/auth'
import { setToken, setRefreshToken, removeToken } from '@/utils/auth'
import { ROLES } from '@/utils/permission'
import { getDisplaySettings, updateDisplaySettings } from '@/api/display'
import { useTheme } from '@/composables/useTheme'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: null,
    roles: [],
    targetReward: null,
    displaySettings: null
  }),
  getters: {
    isAdmin: state => state.roles.includes(ROLES.ADMIN),
    isChild: state => state.roles.includes(ROLES.CHILD),
    isLogin: state => !!state.token,
    stars: state => state.userInfo?.stars || 0,
    equippedAchievement: state => state.displaySettings?.equippedAchievementId || null,
    equippedStickers: state => [
      state.displaySettings?.equippedSticker1Id,
      state.displaySettings?.equippedSticker2Id
    ].filter(Boolean),
    currentTheme: state => state.displaySettings?.theme || 'pink'
  },
  actions: {
    async loginParentAction(data) {
      const res = await loginParent(data)
      this.token = res.token
      setToken(res.token)
      if (res.refreshToken) {
        setRefreshToken(res.refreshToken)
      }
      // Refresh userInfo to get calculated stars
      await this.getUserInfoAction()
      this.roles = [this.userInfo?.role]
      return res
    },
    async loginChildAction(data) {
      const res = await registerChild(data)
      this.token = res.token
      setToken(res.token)
      if (res.refreshToken) {
        setRefreshToken(res.refreshToken)
      }
      // Refresh userInfo to get calculated stars
      await this.getUserInfoAction()
      this.roles = [this.userInfo?.role]
      if (res.user && res.user.deviceId) {
        localStorage.setItem('deviceId', res.user.deviceId)
      }
      return res
    },
    async getUserInfoAction() {
      try {
        const res = await getUserInfo()
        this.userInfo = res
        return res
      } catch (error) {
        console.error('getUserInfoAction error:', error)
        return null
      }
    },
    async loadDisplaySettings() {
      if (!this.userInfo?.id) return
      try {
        const res = await getDisplaySettings(this.userInfo.id)
        this.displaySettings = res?.data || res
        // Apply theme after loading
        if (this.displaySettings?.theme) {
          const { applyTheme } = useTheme()
          applyTheme(this.displaySettings.theme)
        }
      } catch (error) {
        console.error('loadDisplaySettings error:', error)
      }
    },
    async updateDisplaySettingsAction(achievementId, sticker1Id, sticker2Id, theme) {
      if (!this.userInfo?.id) return
      try {
        await updateDisplaySettings({
          userId: this.userInfo.id,
          equippedAchievementId: achievementId,
          equippedSticker1Id: sticker1Id,
          equippedSticker2Id: sticker2Id,
          theme: theme
        })
        await this.loadDisplaySettings()
      } catch (error) {
        console.error('updateDisplaySettingsAction error:', error)
      }
    },
    async updateThemeAction(theme) {
      if (!this.userInfo?.id) return
      try {
        await updateDisplaySettings({
          userId: this.userInfo.id,
          theme: theme
        })
        await this.loadDisplaySettings()
      } catch (error) {
        console.error('updateThemeAction error:', error)
      }
    },
    setTargetReward(reward) {
      this.targetReward = reward
      localStorage.setItem('targetReward', JSON.stringify(reward))
    },
    clearTargetReward() {
      this.targetReward = null
      localStorage.removeItem('targetReward')
    },
    logoutAction() {
      this.token = ''
      this.userInfo = null
      this.roles = []
      this.targetReward = null
      this.displaySettings = null
      removeToken()
    }
  },
  persist: {
    key: 'USER_STORE',
    storage: localStorage,
    paths: ['token', 'userInfo', 'roles', 'targetReward']
  }
})
