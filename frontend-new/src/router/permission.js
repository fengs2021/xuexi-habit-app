import router from './index'
import { useUserStore } from '@/store/modules/user'
import { getToken } from '@/utils/auth'
import { ElMessage } from 'element-plus'

const whiteList = ['/login']

router.beforeEach(async (to, from, next) => {
  const token = getToken()
  const userStore = useUserStore()

  if (token) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      const hasUserInfo = !!userStore.userInfo
      if (hasUserInfo) {
        if (to.meta.roles && to.meta.roles.length > 0) {
          const hasPermission = to.meta.roles.some(role => userStore.roles.includes(role))
          if (hasPermission) {
            next()
          } else {
            ElMessage.error('你没有权限访问该页面')
            next(from.path || '/dashboard')
          }
        } else {
          next()
        }
      } else {
        try {
          await userStore.getUserInfoAction()
          next({ ...to, replace: true })
        } catch (error) {
          userStore.logoutAction()
          next('/login')
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

router.afterEach((to) => {
  document.title = to.meta.title ? to.meta.title + ' - ' + import.meta.env.VITE_APP_TITLE : import.meta.env.VITE_APP_TITLE
})
