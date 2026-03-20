<template>
  <div class="mobile-layout">
    <van-nav-bar
      v-if="showHeader"
      :title="title"
      :left-text="canGoBack ? '返回' : ''"
      :left-arrow="canGoBack"
      @click-left="goBack"
    />

    <div class="mobile-content" :class="{ 'has-tabbar': showTabBar }">
      <router-view />
    </div>

    <van-tabbar v-if="showTabBar" v-model="activeTab" @change="onTabChange">
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
import { ref, computed } from 'vue'
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

const tabBarItems = computed(() => {
  const baseItems = [
    { path: '/dashboard', label: '首页', icon: 'home-o' },
    { path: '/task', label: '任务', icon: 'task-o' },
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

const canGoBack = computed(() => window.history.length > 1)
const goBack = () => router.back()

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
.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  background-color: #f5f5f5;
}
.mobile-content.has-tabbar {
  padding-bottom: 60px;
}
</style>
