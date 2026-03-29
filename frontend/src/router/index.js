import { createRouter, createWebHistory } from 'vue-router'
import { ROLES } from '@/utils/permission'

const constantRoutes = [
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

const asyncRoutes = [
  {
    path: '/',
    component: () => import('@/layout/MobileLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: { title: '首页', icon: 'home-o', roles: [ROLES.ADMIN, ROLES.CHILD] }
      },
      {
        path: 'task',
        name: 'Task',
        component: () => import('@/views/Task/index.vue'),
        meta: { title: '任务', icon: 'task-o', roles: [ROLES.ADMIN, ROLES.CHILD] }
      },
      {
        path: 'reward',
        name: 'Reward',
        component: () => import('@/views/Reward/index.vue'),
        meta: { title: '奖励', icon: 'gift-o', roles: [ROLES.ADMIN, ROLES.CHILD] }
      },
      {
        path: 'exchange',
        name: 'Exchange',
        component: () => import('@/views/Exchange/index.vue'),
        meta: { title: '兑换审批', icon: 'records-o', roles: [ROLES.ADMIN] }
      },
      {
        path: 'family',
        name: 'Family',
        component: () => import('@/views/Family/index.vue'),
        meta: { title: '家庭', icon: 'friends-o', roles: [ROLES.ADMIN, ROLES.CHILD] }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics/index.vue'),
        meta: { title: '统计', icon: 'chart-trending-o', roles: [ROLES.ADMIN, ROLES.CHILD] }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile/index.vue'),
        meta: { title: '我的', icon: 'user-o', roles: [ROLES.ADMIN, ROLES.CHILD] }
      },
      {
        path: 'study',
        name: 'Study',
        component: () => import('@/views/Study/index.vue'),
        meta: { title: '学习', icon: 'book-open-o', roles: [ROLES.ADMIN, ROLES.CHILD] }
      },
      {
        path: 'study/add',
        name: 'StudyAdd',
        component: () => import('@/views/Study/AddRecord.vue'),
        meta: { title: '添加记录', icon: 'plus', roles: [ROLES.ADMIN], hidden: true }
      },
      {
        path: 'study/questions',
        name: 'StudyQuestions',
        component: () => import('@/views/Study/Questions.vue'),
        meta: { title: '题库', icon: 'question-o', roles: [ROLES.ADMIN, ROLES.CHILD] }
      },
      {
        path: 'study/wrong',
        name: 'StudyWrong',
        component: () => import('@/views/Study/WrongQuestions.vue'),
        meta: { title: '错题本', icon: 'fail-icon', roles: [ROLES.ADMIN, ROLES.CHILD] }
      },
      {
        path: 'study/practice',
        name: 'StudyPractice',
        component: () => import('@/views/Study/Practice.vue'),
        meta: { title: '练习', icon: 'edit', roles: [ROLES.CHILD] }
      },
      {
        path: 'study/subjects',
        name: 'StudySubjects',
        component: () => import('@/views/Study/Subjects.vue'),
        meta: { title: '科目管理', icon: 'setting-o', roles: [ROLES.ADMIN], hidden: true }
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
