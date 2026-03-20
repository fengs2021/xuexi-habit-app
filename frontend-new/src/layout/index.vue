<template>
  <div class="layout-container">
    <el-header class="layout-header">
      <div class="logo">{{ VITE_APP_TITLE }}</div>
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32" icon="UserFilled" />
            <span class="username">{{ userStore.userInfo?.nickname }}</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <div class="layout-main">
      <el-aside width="220px" class="layout-aside">
        <el-menu
          :default-active="route.path"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item
            v-for="route in menuRoutes"
            :key="route.path"
            :index="route.path"
          >
            <el-icon><component :is="route.meta.icon" /></el-icon>
            <span>{{ route.meta.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="layout-content">
        <router-view />
      </el-main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { asyncRoutes } from '@/router'
import { ElMessageBox } from 'element-plus'

const VITE_APP_TITLE = import.meta.env.VITE_APP_TITLE
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const menuRoutes = computed(() => {
  return asyncRoutes.filter(r => {
    if (r.children && r.children.length > 0) {
      const child = r.children[0]
      if (child.meta.hidden) return false
      if (!child.meta.roles || child.meta.roles.length === 0) return true
      return child.meta.roles.some(role => userStore.roles.includes(role))
    }
    return false
  }).map(r => r.children[0])
})

const handleCommand = (command) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logoutAction()
      router.push('/login')
    }).catch(() => {})
  }
}
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  padding: 0 20px;
  .logo {
    font-size: 18px;
    font-weight: bold;
    color: #409EFF;
  }
  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      .username {
        font-size: 14px;
      }
    }
  }
}
.layout-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.layout-aside {
  background-color: #304156;
  height: 100%;
  overflow-y: auto;
}
.layout-content {
  flex: 1;
  background-color: #f0f2f5;
  overflow-y: auto;
  padding: 20px;
}
</style>
