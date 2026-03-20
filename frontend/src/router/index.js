import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: () => import('../pages/Login.vue') },
  { path: '/home', name: 'Home', component: () => import('../pages/Home.vue') },
  { path: '/exchange', name: 'Exchange', component: () => import('../pages/Exchange.vue') },
  { path: '/manage', name: 'Manage', component: () => import('../pages/Manage.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (!token && to.path !== '/login') {
    next('/login')
  } else if (token && to.path === '/login') {
    next('/home')
  } else {
    next()
  }
})

export default router
