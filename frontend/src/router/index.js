import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/Login.vue')
  },
  {
    path: '/guide',
    name: 'Guide',
    component: () => import('../pages/Guide.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../pages/Home.vue')
  },
  {
    path: '/manage',
    name: 'Manage',
    component: () => import('../pages/Manage.vue')
  },
  {
    path: '/exchange',
    name: 'Exchange',
    component: () => import('../pages/Exchange.vue')
  },
  {
    path: '/log',
    name: 'Log',
    component: () => import('../pages/Log.vue')
  },
  {
    path: '/achievement',
    name: 'Achievement',
    component: () => import('../pages/Achievement.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../pages/Settings.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (!token && to.path !== '/login' && to.path !== '/guide') {
    next('/login')
  } else {
    next()
  }
})

export default router
