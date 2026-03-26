import router from './index'
import { useUserStore } from '@/store/modules/user'
import { getToken } from '@/utils/auth'
import { showToast } from 'vant'

const whiteList = ['/login']

router.beforeEach(async (to, from, next) => {
  const token = getToken()
  const userStore = useUserStore()

  if (token) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      if (!userStore.userInfo) {
        try {
          await userStore.getUserInfoAction()
          next({ ...to, replace: true })
        } catch {
          userStore.logoutAction()
          next('/login')
        }
      } else {
        if (to.meta.roles && to.meta.roles.length) {
          const hasPermission = to.meta.roles.some(role => userStore.roles.includes(role))
          if (hasPermission) {
            next()
          } else {
            showToast('无权限访问')
            next(from.path || '/dashboard')
          }
        } else {
          next()
        }
      }
    }
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next('/login')
    }
  }
})
