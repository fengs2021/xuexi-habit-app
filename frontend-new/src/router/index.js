import { createRouter, createWebHistory } from 'vue-router'
import { ROLES } from '@/utils/permission'
import './permission'

export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/404.vue'),
    meta: { title: '404', hidden: true }
  }
]

export const asyncRoutes = [
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: { title: '首页', icon: 'House', roles: [ROLES.ADMIN, ROLES.CHILD] }
      }
    ]
  },
  {
    path: '/task',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '',
        name: 'Task',
        component: () => import('@/views/Task/index.vue'),
        meta: { title: '任务管理', icon: 'List', roles: [ROLES.ADMIN, ROLES.CHILD] }
      }
    ]
  },
  {
    path: '/reward',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '',
        name: 'Reward',
        component: () => import('@/views/Reward/index.vue'),
        meta: { title: '奖励管理', icon: 'Present', roles: [ROLES.ADMIN, ROLES.CHILD] }
      }
    ]
  },
  {
    path: '/exchange',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '',
        name: 'Exchange',
        component: () => import('@/views/Exchange/index.vue'),
        meta: { title: '兑换审批', icon: 'Check', roles: [ROLES.ADMIN] }
      }
    ]
  },
  {
    path: '/statistics',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '',
        name: 'Statistics',
        component: () => import('@/views/Statistics/index.vue'),
        meta: { title: '数据统计', icon: 'DataAnalysis', roles: [ROLES.ADMIN, ROLES.CHILD] }
      }
    ]
  },
  {
    path: '/family',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '',
        name: 'Family',
        component: () => import('@/views/Family/index.vue'),
        meta: { title: '家庭管理', icon: 'HomeFilled', roles: [ROLES.ADMIN, ROLES.CHILD] }
      }
    ]
  },
  {
    path: '/profile',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '',
        name: 'Profile',
        component: () => import('@/views/Profile/index.vue'),
        meta: { title: '个人中心', icon: 'User', roles: [ROLES.ADMIN, ROLES.CHILD], hidden: true }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/404', hidden: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes: [...constantRoutes, ...asyncRoutes]
})

export default router
