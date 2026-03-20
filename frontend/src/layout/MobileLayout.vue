<template>
  <div class="mobile-layout">
    <div class="header-bar">
      <div class="header-left">
        <span class="role-tag" :class="userStore.isAdmin ? 'admin' : 'child'">
          {{ userStore.isAdmin ? '家长' : '学生' }}
        </span>
        <span class="nickname">{{ userStore.userInfo?.nickname || '' }}</span>
      </div>
      <div class="header-right">
        <span class="total-stars">总积分: {{ totalStars }}</span>
        <span class="current-stars">现有: {{ userStore.userInfo?.stars || 0 }} ★</span>
      </div>
    </div>

    <div class="mobile-content" :class="{ 'has-tabbar': showTabBar }">
      <router-view />
    </div>

    <van-tabbar v-if="showTabBar" v-model="activeTab" @change="onTabChange" fixed placeholder>
      <van-tabbar-item
        v-for="item in tabBarItems"
        :key="item.path"
        :name="item.path"
        :icon="item.icon"
      >
        {{ item.label }}
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'
import { useUserStore } from '@/store/modules/user'

const props = defineProps({
  showHeader: { type: Boolean, default: true },
  title: { type: String, default: '' },
  showTabBar: { type: Boolean, default: true }
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const totalStars = computed(() => {
  // 总积分 = 现有积分 + 已兑换/已消耗的积分
  return userStore.userInfo?.totalStars || userStore.userInfo?.stars || 0
})

const tabBarItems = computed(() => {
  const baseItems = [
    { path: '/dashboard', label: '首页', icon: 'wap-home-o' },
    { path: '/task', label: '任务', icon: 'orders-o' },
    { path: '/reward', label: '奖励', icon: 'gift-o' },
    { path: '/family', label: '家庭', icon: 'friends-o' },
    { path: '/profile', label: '我的', icon: 'user-o' }
  ]
  if (userStore.isAdmin) {
    baseItems.splice(3, 0, { path: '/exchange', label: '审批', icon: 'records-o' })
  }
  return baseItems
})

const activeTab = ref(route.path)

const onTabChange = (path) => {
  router.push(path)
}

onBeforeRouteUpdate((to) => {
  activeTab.value = to.path
})
</script>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.role-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}
.role-tag.admin {
  background: rgba(255,255,255,0.3);
}
.role-tag.child {
  background: rgba(255,255,255,0.3);
}
.nickname {
  font-size: 16px;
  font-weight: bold;
}
.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.total-stars {
  font-size: 11px;
  opacity: 0.85;
}
.current-stars {
  font-size: 14px;
  font-weight: bold;
}
.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  background-color: #f5f5f5;
}
.mobile-content.has-tabbar {
  padding-bottom: 70px;
}
</style>
